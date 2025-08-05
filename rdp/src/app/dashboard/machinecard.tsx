"use client";

import { Button, Card, Spinner } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MachineCard({
  name,
  status,
  id,
}: {
  name: string;
  status: boolean;
  id: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    router.push(`/connect?id=${id}&type=client`);
  };

  return (
    <Card className="max-w-sm p-4 flex flex-col items-start space-y-3">
      <h5 className="text-xl font-semibold text-gray-900 dark:text-white  w-full">
        {name}
      </h5>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Status: {status ? "Online" : "Offline"}
      </p>
      <Button
        onClick={handleClick}
        disabled={loading}
        className="bg-teal-500 hover:bg-teal-600 text-white w-full"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <Spinner aria-label="Connecting..." size="sm" />
            <span className="ml-2">Connecting...</span>
          </span>
        ) : (
          "Connect"
        )}
      </Button>
    </Card>
  );
}
