
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { certificateSchema, type CertificateFormData } from '@/schemas/certificate-schema';

// Check for the service role key at module start.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set. PDF storage will fail.");
}

// Service role client for backend operations like storage uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }) } catch (error) {} },
          remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }) } catch (error) {} },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized: User session not found.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const body: CertificateFormData = await req.json();
    const validation = certificateSchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(JSON.stringify({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const formData = validation.data;

    let existingPdfBytes;
    try {
        const pdfPath = path.join(process.cwd(), 'public', 'Completion.pdf');
        existingPdfBytes = await fs.readFile(pdfPath);
    } catch (fsError) {
        console.error('Error reading PDF template:', fsError);
        throw new Error('PDF template file "public/Completion.pdf" not found on the server. Please ensure it has been uploaded.');
    }
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    const black = rgb(0, 0, 0);
    const fontSize = 10;

    firstPage.drawText(`${formData.title} ${formData.name}`, { x: 150, y: height - 154, font, size: fontSize, color: black });
    firstPage.drawText(formData.address, { x: 150, y: height - 177, font, size: fontSize, color: black });
    firstPage.drawText(`${formData.state}, ${formData.district} - ${formData.areaPin}`, { x: 150, y: height - 200, font, size: fontSize, color: black });
    firstPage.drawText(`${formData.mainSwitchAmps} Amps`, { x: 270, y: height - 332, font, size: fontSize, color: black });

    let yPosition = height - 392;
    formData.equipments.forEach((equip, index) => {
        if (yPosition < 0) return; // Stop if we run out of space
        firstPage.drawText(`${index + 1}.`, { x: 75, y: yPosition, font, size: fontSize, color: black });
        firstPage.drawText(equip.name, { x: 120, y: yPosition, font, size: fontSize, color: black });
        firstPage.drawText(equip.capacity.toString(), { x: 310, y: yPosition, font, size: fontSize, color: black });
        firstPage.drawText(equip.quantity.toString(), { x: 425, y: yPosition, font, size: fontSize, color: black });
        yPosition -= 18;
    });

    const pdfBytes = await pdfDoc.save();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set. Cannot upload to storage.');
    }

    const certificateId = crypto.randomUUID();
    const filePath = `certificates/${user.id}/${certificateId}.pdf`;

    const { error: storageError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) {
      console.error('Supabase Storage Error:', storageError);
      throw new Error(`Failed to save certificate to storage. Please check bucket policies and configuration. Details: ${storageError.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('certificates')
      .insert({
        id: certificateId,
        user_id: user.id,
        payload: formData as any,
        pdf_url: publicUrl,
      });
      
    if (dbError) {
      console.error('Supabase DB Error:', dbError);
      await supabaseAdmin.storage.from('certificates').remove([filePath]);
      throw new Error(`Failed to record certificate in database. Please check table permissions and schema. Details: ${dbError.message}`);
    }
    
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Completion_Certificate.pdf"',
      },
    });

  } catch (error: any) {
    console.error('Certificate API Error:', error);
    return new NextResponse(JSON.stringify({ message: error.message || 'An internal server error occurred.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
