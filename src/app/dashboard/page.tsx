"use client";

import NavigationBar from "@/components/navigation";
import MachineCard from "./machinecard";
import { useEffect, useState } from "react";

type Machine = {
  ID: string;
  Name: string;
  OwnerID: string;
  Status: boolean;
};

export default function Page() {
  const [machines, setMachines] = useState<Machine[]>([]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/machines`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.warn("Machines is not an array, you are not authorized");
        setMachines([]);
        return;
      }
      setMachines(data);
    } catch (e) {
      console.error("Failed to get configs", e);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);
  console.log(machines);

  return (
    <div className="font-sans">
      <div className="flex h-20">
        <NavigationBar />
      </div>
      <div>
        {machines.length === 0 ? (
          <div className="flex items-center justify-center h-full w-full min-h-[300px]">
            <p className="text-lg text-gray-600">Log in to get started!</p>
          </div>
        ) : (
          <main className="ml-4 p-4 max-w-fit grid grid-cols-4 gap-4">
            {Object.values(machines).map((machine) => (
              <MachineCard
                key={machine.ID}
                id={machine.ID}
                name={machine.Name}
                status={machine.Status}
              />
            ))}
          </main>
        )}
      </div>
    </div>
  );
}
