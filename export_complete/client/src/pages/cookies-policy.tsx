import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function CookiesPolicy() {
  useEffect(() => {
    document.title = "Cookies Policy - BookMyLook";
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
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Cookies Policy</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-800 text-center">
              For the complete and up-to-date Cookies Policy, please visit: 
              <br />
              <a 
                href="https://bookmylook.net/cookie-privacy-policy/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                https://bookmylook.net/cookie-privacy-policy/
              </a>
            </p>
          </div>
          
          <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
            <iframe 
              src="https://bookmylook.net/cookie-privacy-policy/"
              className="w-full h-full"
              title="BookMyLook Cookies Policy"
              frameBorder="0"
              loading="lazy"
            />
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Having trouble viewing the policy? <a href="https://bookmylook.net/cookie-privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open in new tab</a></p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}