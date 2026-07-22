import CameraCapture from "@/components/camera/CameraCapture";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <CameraCapture />
    </div>
  );
}
