import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function PricingPolicy() {
  useEffect(() => {
    document.title = "Pricing & Refund Policy - BookMyLook";
    
    const title = "Pricing & Refund Policy - BookMyLook";
    const description = "BookMyLook's complete pricing and refund policy covering commission charges, refund eligibility, procedures, and terms.";
    const url = window.location.origin + "/pricing-policy";
    
    // Set or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Set Open Graph tags
    const setOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    
    setOGTag('og:title', title);
    setOGTag('og:description', description);
    setOGTag('og:type', 'website');
    setOGTag('og:url', url);
    setOGTag('og:site_name', 'BookMyLook');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Pricing & Refund Policy</h1>
          <p className="text-lg text-gray-600 text-center mb-8">BookMyLook Private Limited</p>
          
          <div className="prose prose-gray max-w-none space-y-8">
            <p className="text-gray-600 mb-8">This Pricing & Refund Policy ("Policy") governs the terms relating to service charges and refunds applicable to transactions conducted through the website and mobile application operated by BookMyLook Private Limited ("Company", "we", "our", or "us"). By accessing or using our platform, you ("Customer", "User", or "you") agree to the terms outlined herein.</p>
            
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Pricing Policy</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.1 Commission Charges</h3>
                <p className="text-gray-700 mb-3">
                  <strong>1.1.1</strong> The Company shall levy a service charge of ₹1.50 (One Rupee and Fifty Paise) for every ₹50 (Fifty Rupees) spent by a Customer through the website or mobile application.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>1.1.2</strong> By way of illustration:
                </p>
                <ul className="list-disc list-inside text-gray-700 ml-6 mb-4">
                  <li>On a transaction of ₹50, the applicable charge shall be ₹1.50.</li>
                  <li>On a transaction of ₹100, the applicable charge shall be ₹3.00.</li>
                  <li>On a transaction of ₹500, the applicable charge shall be ₹15.00.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.2 Transparency of Charges</h3>
                <p className="text-gray-700 mb-3">
                  <strong>1.2.1</strong> All applicable charges shall be displayed clearly at the time of checkout, prior to payment confirmation.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>1.2.2</strong> No hidden charges shall be levied by the Company, other than those expressly stated.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.3 Taxes</h3>
                <p className="text-gray-700 mb-3">
                  <strong>1.3.1</strong> Government taxes, including but not limited to Goods and Services Tax (GST), if applicable, shall be charged in addition to the service fee.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">1.4 Right to Revision</h3>
                <p className="text-gray-700 mb-3">
                  <strong>1.4.1</strong> The Company reserves the right to revise, amend, or update the Pricing Policy at any time without prior notice.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>1.4.2</strong> Any such revision shall be deemed effective upon publication on the website and/or mobile application.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Refund Policy</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 General Provisions</h3>
                <p className="text-gray-700 mb-3">
                  <strong>2.1.1</strong> Refunds shall apply only to transactions completed through online payment on the Company's platform.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>2.1.2</strong> Refunds, once approved, shall be processed to the original mode of payment within seven (7) working days.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>2.1.3</strong> Refund eligibility shall be determined strictly in accordance with the conditions outlined herein.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Conditions for Refund Eligibility</h3>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">a. Service Provider Denial After Approval</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>2.2.1</strong> In the event a booking is initially accepted/approved by a service provider but subsequently cancelled or denied by the same service provider, the Customer shall be entitled to a full refund of the payment made online.
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">b. Excessive Waiting Time</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>2.2.2</strong> In the event a Customer is required to wait for more than ten (10) minutes at the service location without commencement of service, the Customer may raise a refund request.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong>2.2.3</strong> Such a request must be reported to the Company on the same day through the website, application, or customer support.
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">c. Customer-Initiated Cancellation</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>2.2.4</strong> Where a Customer cancels a confirmed booking, such Customer must inform the service provider not less than one (1) hour prior to the scheduled appointment time in order to qualify for a refund.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong>2.2.5</strong> Cancellations notified less than one (1) hour prior to the appointment shall render the Customer ineligible for a refund.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Refund Procedure</h3>
                <p className="text-gray-700 mb-3">
                  <strong>2.3.1</strong> Refund requests must be initiated by the Customer via the Company's website, mobile application, or customer support channels.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>2.3.2</strong> Upon verification of eligibility under Clause 2.2, the Company shall process the refund.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>2.3.3</strong> The refunded amount shall be credited to the original mode of payment within seven (7) working days from the date of approval.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Non-Refundable Situations</h3>
                <p className="text-gray-700 mb-3">
                  <strong>2.4.1</strong> Refunds shall not be applicable under the following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 ml-6 mb-4">
                  <li>Failure of the Customer to provide at least one (1) hour prior notice of cancellation;</li>
                  <li>Voluntary refusal of service by the Customer without prior notification;</li>
                  <li>Delays or failures arising due to force majeure events or circumstances beyond the reasonable control of the service provider, including but not limited to natural calamities, emergencies, traffic disruptions, or technical issues.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">2.5 Policy Amendments</h3>
                <p className="text-gray-700 mb-3">
                  <strong>2.5.1</strong> The Company reserves the right to modify, amend, or revise this Refund Policy at any time without prior notice.
                </p>
                <p className="text-gray-700 mb-3">
                  <strong>2.5.2</strong> Any modification shall become effective immediately upon being published on the website and/or mobile application.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Governing Law</h2>
              <p className="text-gray-600">
                This Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in relation to this Policy shall be subject to the exclusive jurisdiction of the courts situated at Srinagar, Jammu & Kashmir, India.
              </p>
            </section>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Having trouble viewing the policy? <a href="https://bookmylook.net/pricing-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open in new tab</a></p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}