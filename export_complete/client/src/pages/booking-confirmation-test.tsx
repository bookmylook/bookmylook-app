import { useParams } from "wouter";

console.log("✅ TEST PAGE LOADED!");

export default function BookingConfirmationTest() {
  const params = useParams();
  console.log("✅ TEST COMPONENT RENDERING with params:", params);
  
  return (
    <div className="min-h-screen bg-green-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <h1 className="text-4xl font-bold">TEST PAGE WORKS!</h1>
        <p className="mt-4">Booking ID: {params.id || "NO ID"}</p>
        <pre className="mt-4">{JSON.stringify(params, null, 2)}</pre>
      </div>
    </div>
  );
}
