
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { certificateSchema, type CertificateFormData } from '@/schemas/certificate-schema';

// Service role client for backend operations like storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const body: CertificateFormData = await req.json();
    const validation = certificateSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }), { status: 400 });
    }

    const formData = validation.data;

    // Load the existing PDF template
    const pdfPath = path.join(process.cwd(), 'public', 'Completion.pdf');
    const existingPdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    // Define coordinates and draw text (adjust these based on your PDF template)
    // These coordinates are estimations and will likely need fine-tuning.
    // Origin (0,0) is the bottom-left corner of the page.
    const black = rgb(0, 0, 0);
    const fontSize = 10;

    firstPage.drawText(`${formData.title} ${formData.name}`, { x: 150, y: height - 154, font, size: fontSize, color: black });
    firstPage.drawText(formData.address, { x: 150, y: height - 177, font, size: fontSize, color: black });
    firstPage.drawText(`${formData.state}, ${formData.district} - ${formData.areaPin}`, { x: 150, y: height - 200, font, size: fontSize, color: black });
    firstPage.drawText(`${formData.mainSwitchAmps} Amps`, { x: 270, y: height - 332, font, size: fontSize, color: black });

    // Loop through equipment and draw them
    let yPosition = height - 392;
    formData.equipments.forEach((equip, index) => {
        if (yPosition < 0) return; // Stop if we run out of space
        firstPage.drawText(`${index + 1}.`, { x: 75, y: yPosition, font, size: fontSize, color: black });
        firstPage.drawText(equip.capacity.toString(), { x: 210, y: yPosition, font, size: fontSize, color: black });
        firstPage.drawText(equip.quantity.toString(), { x: 425, y: yPosition, font, size: fontSize, color: black });
        yPosition -= 18; // Decrement Y for the next line
    });

    // Save the modified PDF to a buffer
    const pdfBytes = await pdfDoc.save();

    // --- Supabase Integration ---
    const certificateId = crypto.randomUUID();
    const filePath = `certificates/${certificateId}.pdf`;

    // 1. Upload to Supabase Storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      console.error('Supabase Storage Error:', storageError);
      throw new Error('Failed to save certificate to storage.');
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(filePath);

    // 3. Insert record into Supabase database
    const { error: dbError } = await supabase
      .from('certificates')
      .insert({
        id: certificateId,
        user_id: user.id,
        payload: body as any, // Store the original request body
        pdf_url: publicUrl,
      });
      
    if (dbError) {
      console.error('Supabase DB Error:', dbError);
      // Attempt to clean up storage if DB insert fails
      await supabaseAdmin.storage.from('certificates').remove([filePath]);
      throw new Error('Failed to record certificate in database.');
    }
    
    // Return the generated PDF to the client for download
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Completion_Certificate.pdf"',
      },
    });

  } catch (error: any) {
    console.error('Certificate API Error:', error);
    return new NextResponse(JSON.stringify({ message: error.message || 'An internal server error occurred.' }), { status: 500 });
  }
}
