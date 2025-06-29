
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, MapPin } from 'lucide-react';

interface District {
    id: number;
    name: string;
}

export default function LocationsPage() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!apiKey || apiKey === 'your_rapidapi_key_here') {
                setError("RapidAPI key is not configured. Please add it to your .env file.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch('https://gis-engine.p.rapidapi.com/countries/ph/regions/pam/cities/151245/districts', {
                    method: 'GET',
                    headers: {
                        'x-rapidapi-host': 'gis-engine.p.rapidapi.com',
                        'x-rapidapi-key': apiKey,
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setDistricts(result.data || result); 
            } catch (e: any) {
                console.error("Failed to fetch districts:", e);
                setError(e.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDistricts();
    }, [apiKey]);

    return (
        <div className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
                    <MapPin size={32} /> Locations from API
                </h1>
                <p className="text-muted-foreground">
                    This page displays a list of districts fetched from a third-party GIS API.
                </p>
            </header>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Districts List</CardTitle>
                    <CardDescription>
                        Displaying districts for city ID 151245 in the Philippines.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4">Fetching data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md">
                            <AlertTriangle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>District ID</TableHead>
                                        <TableHead>Name</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {districts.map((district) => (
                                        <TableRow key={district.id}>
                                            <TableCell className="font-medium">{district.id}</TableCell>
                                            <TableCell>{district.name}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
