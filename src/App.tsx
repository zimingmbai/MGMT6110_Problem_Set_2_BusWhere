import React, { useState, useCallback } from 'react';
import { FindMyStop } from './components/FindMyStop';
import { RidePanel } from './components/RidePanel';
import { BusStop } from './types';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [boardingStopCode, setBoardingStopCode] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [destinationStopCode, setDestinationStopCode] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [stopsMap, setStopsMap] = useState<Map<string, BusStop>>(new Map());

  const handleStopsLoaded = useCallback((loadedStops: BusStop[]) => {
    const map = new Map<string, BusStop>();
    for (const stop of loadedStops) {
      map.set(stop.code, stop);
    }
    setStopsMap(map);
  }, []);

  const handleSelectService = (stopCode: string, serviceNumber: string) => {
    setBoardingStopCode(stopCode);
    setSelectedService(serviceNumber);
    setDestinationStopCode(null);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedService(null);
    setDestinationStopCode(null);
    // Note: searchQuery is left untouched per spec!
  };

  const handleSelectDestination = (stopCode: string) => {
    setDestinationStopCode(stopCode);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col antialiased selection:bg-red-100 selection:text-red-900">
      {/* Main Layout Container */}
      <main className="flex-1 flex relative w-full h-screen overflow-hidden">
        {/* FIND MY STOP View */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 ${
            panelOpen ? 'hidden md:flex md:mr-[460px] lg:mr-[490px]' : 'flex'
          }`}
        >
          <FindMyStop
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectService={handleSelectService}
            activeBoardingCode={panelOpen ? boardingStopCode : null}
            activeServiceNumber={panelOpen ? selectedService : null}
            onStopsLoaded={handleStopsLoaded}
          />
        </div>

        {/* Mobile Backdrop */}
        {panelOpen && (
          <div
            id="mobile-backdrop"
            onClick={handleClosePanel}
            className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-none"
            aria-hidden="true"
          />
        )}

        {/* RIDE PANEL */}
        {panelOpen && selectedService && boardingStopCode && (
          <RidePanel
            serviceNumber={selectedService}
            boardingStopCode={boardingStopCode}
            destinationStopCode={destinationStopCode}
            onSelectDestination={handleSelectDestination}
            onClose={handleClosePanel}
            stopsMap={stopsMap}
          />
        )}
      </main>
    </div>
  );
}
