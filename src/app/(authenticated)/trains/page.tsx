
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, TrainFront, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TrainRouteStop {
    station_name: string;
    station_code: string;
    arrival_time: string;
    departure_time: string;
    day_of_journey: number;
    distance_from_source_in_km: number;
}

interface TrainDetails {
    train_name: string;
    train_number: string;
    source_station_name: string;
    destination_station_name: string;
    running_days: string[];
    route: TrainRouteStop[];
}

export default function TrainsPage() {
    const [trainDetails, setTrainDetails] = useState<TrainDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trainNumber, setTrainNumber] = useState('12051'); // Default train number

    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

    const fetchTrainDetails = async () => {
        if (!apiKey || apiKey === 'your_rapidapi_key_here') {
            setError("RapidAPI key is not configured. Please add it to your .env file.");
            setIsLoading(false);
            return;
        }
        
        if (!trainNumber) {
            setError("Please enter a train number.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setTrainDetails(null);

        try {
            const response = await fetch(`https://indian-railway-irctc.p.rapidapi.com/api/trains-search/v1/train/${trainNumber}?isH5=true&client=web`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'indian-railway-irctc.p.rapidapi.com',
                    'x-rapid-api': 'rapid-api-database'
                }
            });

            if (!response.ok) {
                let errorData;
                try {
                   errorData = await response.json();
                } catch(e) {
                   errorData = { message: `HTTP error! status: ${response.status}` };
                }
                throw new Error(errorData.message || `An error occurred while fetching data. Check the train number.`);
            }

            const result = await response.json();
            
            if (result.status === false || !result.data) {
                 throw new Error(result.message || "Failed to fetch train data. The train number might be invalid.");
            }

            setTrainDetails(result.data);
        } catch (e: any) {
            console.error("Failed to fetch train data:", e);
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTrainDetails();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTrainDetails();
    }

    return (
        <div className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
                    <TrainFront size={32} /> Train Route Search
                </h1>
                <p className="text-muted-foreground">
                    This page fetches the route of a specific train from the Indian Railway API.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Search Train Route</CardTitle>
                    <CardDescription>Enter a valid 5-digit train number.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Label htmlFor="trainNumber">Train Number</Label>
                            <Input
                                id="trainNumber"
                                value={trainNumber}
                                onChange={(e) => setTrainNumber(e.target.value)}
                                placeholder="e.g. 12051"
                                className="mt-1"
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4">Fetching train details...</p>
                </div>
            )}
            
            {error && !isLoading && (
                <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {trainDetails && !isLoading && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>{trainDetails.train_name} ({trainDetails.train_number})</CardTitle>
                         <CardDescription className="flex items-center gap-2 font-medium">
                            <span>{trainDetails.source_station_name}</span> 
                            <ArrowRight className="h-4 w-4" /> 
                            <span>{trainDetails.destination_station_name}</span>
                        </CardDescription>
                        <div className="flex flex-wrap gap-1 pt-2">
                            <span className="text-xs font-semibold mr-2">Runs On:</span>
                            {trainDetails.running_days.map(day => <Badge key={day} variant="secondary">{day}</Badge>)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-semibold mb-2 text-primary">Route Details</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Station</TableHead>
                                        <TableHead>Arrival</TableHead>
                                        <TableHead>Departure</TableHead>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Distance (km)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trainDetails.route.length > 0 ? trainDetails.route.map((stop, index) => (
                                        <TableRow key={`${stop.station_code}-${index}`}>
                                            <TableCell className="font-medium">{stop.station_name} ({stop.station_code})</TableCell>
                                            <TableCell>{stop.arrival_time}</TableCell>
                                            <TableCell>{stop.departure_time}</TableCell>
                                            <TableCell>{stop.day_of_journey}</TableCell>
                                            <TableCell>{stop.distance_from_source_in_km}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No route information available for this train.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
