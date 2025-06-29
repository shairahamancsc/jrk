"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle, TrainFront } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Train {
    train_name: string;
    train_no: string;
    from_station_name: string;
    to_station_name: string;
    eta: string; // Expected Time of Arrival
    etd: string; // Expected Time of Departure
}

export default function TrainsPage() {
    const [trains, setTrains] = useState<Train[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stationCode, setStationCode] = useState('BBS'); // Default station code
    const [hours, setHours] = useState('4'); // Default hours

    const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

    const fetchTrains = async () => {
        if (!apiKey || apiKey === 'your_rapidapi_key_here') {
            setError("RapidAPI key is not configured. Please add it to your .env file.");
            setIsLoading(false);
            return;
        }
        
        if (!stationCode) {
            setError("Please enter a station code.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setTrains([]);

        try {
            const response = await fetch(`https://irctc1.p.rapidapi.com/api/v3/getLiveStation?fromStationCode=${stationCode}&hours=${hours}&lang=en`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'irctc1.p.rapidapi.com',
                    'x-rapidapi-key': apiKey,
                }
            });

            if (!response.ok) {
                let errorData;
                try {
                   errorData = await response.json();
                } catch(e) {
                   errorData = { message: `HTTP error! status: ${response.status}` };
                }
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if(result.status === false) {
                 throw new Error(result.message || "Failed to fetch data from the API. The station code might be invalid.");
            }

            setTrains(result.data?.train_between_stations || []);
        } catch (e: any) {
            console.error("Failed to fetch train data:", e);
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Fetch trains for the default station on initial load
    useEffect(() => {
        fetchTrains();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTrains();
    }

    return (
        <div className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
                    <TrainFront size={32} /> Live Station Train Status
                </h1>
                <p className="text-muted-foreground">
                    This page fetches live train arrivals and departures from the IRCTC API.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Search Trains</CardTitle>
                    <CardDescription>Enter a station code (e.g., BBS, NDLS, HWH) and the time window in hours.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Label htmlFor="stationCode">Station Code</Label>
                            <Input
                                id="stationCode"
                                value={stationCode}
                                onChange={(e) => setStationCode(e.target.value.toUpperCase())}
                                placeholder="e.g. BBS"
                                className="mt-1"
                            />
                        </div>
                        <div className="flex-1 w-full">
                             <Label htmlFor="hours">Time Window (Hours)</Label>
                             <Input
                                id="hours"
                                type="number"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="e.g. 4"
                                className="mt-1"
                                min="1"
                                max="8"
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Trains at {stationCode || 'N/A'}</CardTitle>
                     <CardDescription>
                        Displaying trains scheduled within the next {hours} hour(s).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4">Fetching train data...</p>
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
                                        <TableHead>Train Name</TableHead>
                                        <TableHead>Train No.</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Arrival (ETA)</TableHead>
                                        <TableHead>Departure (ETD)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trains.length > 0 ? trains.map((train, index) => (
                                        <TableRow key={`${train.train_no}-${index}`}>
                                            <TableCell className="font-medium">{train.train_name}</TableCell>
                                            <TableCell>{train.train_no}</TableCell>
                                            <TableCell>{train.from_station_name}</TableCell>
                                            <TableCell>{train.to_station_name}</TableCell>
                                            <TableCell>{train.eta}</TableCell>
                                            <TableCell>{train.etd}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                No trains found for the specified criteria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
