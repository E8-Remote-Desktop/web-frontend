"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const RDP = dynamic(() => import("../../components/RDP"), { ssr: false });

export default function Connect() {
  const searchParams = useSearchParams();
  const machineID = searchParams.get("id");
  return <RDP id={machineID!} />;
}
