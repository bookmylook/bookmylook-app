import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function TermsTest() {
  useEffect(() => {
    document.title = "Terms Test - BookMyLook";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Terms Test Page</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-8">This is a test page to debug routing issues.</p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Success!</h3>
              <p className="text-green-700">If you can see this page, the routing is working correctly.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}