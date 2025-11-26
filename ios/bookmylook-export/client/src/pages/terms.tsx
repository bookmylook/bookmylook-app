import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useEffect } from "react";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms & Conditions - BookMyLook";
    
    const description = "Read the terms and conditions for using BookMyLook beauty services marketplace. Learn about your rights and responsibilities as a user.";
    const url = window.location.origin + "/terms";
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 pb-20">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-purple-600 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-600">Last Updated: October 6, 2025</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 mb-4">
              This document is an agreement between you and <strong>BOOKMYLOOK PRIVATE LIMITED</strong>, doing business as "BOOKMYLOOK".
            </p>
            <p className="text-gray-700 mb-4">
              You acknowledge and agree that by accessing or using this website or using any services owned or operated by this website, you have agreed to be bound and abide by these terms of service ("Terms of Service"), our privacy notice ("Privacy Notice"), and any additional terms that apply.
            </p>
            <p className="text-gray-700 mb-4">
              These Terms govern the conditions of allowing the use of this website, and any other related Agreement or legal relationship with the Owner in a legally binding way.
            </p>
            <p className="text-gray-700 font-semibold">
              The User must read this document carefully.
            </p>
            <p className="text-gray-700 mt-4">
              If you do not agree to all of these Terms of Service and any additional terms that apply to you, do not use this website.
            </p>
          </section>

          {/* Provider Information */}
          <section className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">This Website is provided by:</h2>
            <p className="text-gray-700 mb-2"><strong>BOOKMYLOOK PRIVATE LIMITED</strong>, doing business as "BOOKMYLOOK"</p>
            <p className="text-gray-700 mb-2">240, WASHBUGH PULWAMA, JAMMU AND KASHMIR</p>
            <p className="text-gray-700 mb-2">SRINAGAR, India - 192301</p>
            <p className="text-gray-700">Owner contact email: <a href="mailto:info@bookmylook.net" className="text-purple-600 hover:underline">info@bookmylook.net</a></p>
            <p className="text-gray-700">Phone: <a href="tel:+919906145666" className="text-purple-600 hover:underline">+91 9906145666</a></p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Definitions and Legal References</h2>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="font-semibold">This Website (or this Application)</h3>
                <p>The property that enables the provision of the Service.</p>
              </div>
              <div>
                <h3 className="font-semibold">Agreement</h3>
                <p>Any legally binding or contractual relationship between the Owner and the User, governed by these Terms.</p>
              </div>
              <div>
                <h3 className="font-semibold">The Owner (or We)</h3>
                <p>BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" – The natural person(s) or legal entity that provides this Website and/or the Service to Users.</p>
              </div>
              <div>
                <h3 className="font-semibold">Service</h3>
                <p>The service provided by this Website, as described in these Terms and on this Website.</p>
              </div>
              <div>
                <h3 className="font-semibold">Terms</h3>
                <p>Provisions applicable to the use of this Website and Services in this or other related documents, subject to change from time to time, without notice.</p>
              </div>
              <div>
                <h3 className="font-semibold">User (or You)</h3>
                <p>The natural person or legal entity that uses this Website.</p>
              </div>
            </div>
          </section>

          {/* Terms of Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Terms of Use</h2>
            <p className="text-gray-700 mb-4">
              Single or additional conditions of use or access may apply in specific cases and are additionally indicated within this document.
            </p>
            <p className="text-gray-700">
              By using this Website, Users confirm to meet the requirements specified herein.
            </p>
          </section>

          {/* Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Content on This Website</h2>
            <p className="text-gray-700 mb-4">
              Unless otherwise specified, all Website Content is provided or owned by the Owner or its licensors.
            </p>
            <p className="text-gray-700">
              The Owner has made efforts to ensure that the Website Content does not violate legal provisions or third-party rights. However, it's not always possible to achieve such a result. In such cases, the User is requested to report complaints using the contact details specified in this document.
            </p>
          </section>

          {/* External Resources */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Access to External Resources</h2>
            <p className="text-gray-700">
              Through this Website, Users may have access to external resources provided by third parties. Users acknowledge and accept that the Owner has no control over such resources and is therefore not responsible for their content and availability.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceptable Use</h2>
            <p className="text-gray-700">
              This Website and the Service may only be used within the scope of what they are provided for, under these Terms and applicable law. Users are solely responsible for making sure that their use of this Website and/or the Service violates no applicable law, regulations, or third-party rights.
            </p>
          </section>

          {/* Common Provisions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Common Provisions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Waiver</h3>
                <p className="text-gray-700">
                  The Owner's failure to assert any right or provision under these Terms shall not constitute a waiver of any such right or provision. No waiver shall be considered a further or continuing waiver of such term or any other term.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Service Interruption</h3>
                <p className="text-gray-700 mb-2">
                  To ensure the best possible service level, the Owner reserves the right to interrupt the Service for maintenance, system updates, or any other changes, informing the Users appropriately.
                </p>
                <p className="text-gray-700">
                  Within the limits of law, the Owner may also decide to suspend or terminate the Service altogether. Additionally, the Service might not be available due to reasons outside the Owner's reasonable control, such as "force majeure" (e.g., labor actions, infrastructural breakdowns or blackouts, etc.).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Service Reselling</h3>
                <p className="text-gray-700">
                  Users may not reproduce, duplicate, copy, sell, resell, or exploit any portion of this Website and of its Service without the Owner's express prior written permission, granted either directly or through a legitimate reselling program.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-4">
              Any intellectual property rights, such as copyrights, trademark rights, patent rights, and design rights related to this Website are the exclusive property of the Owner or its licensors.
            </p>
            <p className="text-gray-700">
              Any trademarks and all other marks, trade names, service marks, wordmarks, illustrations, images, or logos appearing in connection with this Website and/or the Service are the exclusive property of the Owner or its licensors. The said intellectual property rights are protected by applicable laws or international treaties related to intellectual property.
            </p>
          </section>

          {/* Ownership of Media and AI Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Ownership of Media and AI Content (GDPR, CCPA)</h2>
            <p className="text-gray-700">
              All media, videos, audio, and AI-generated content are the intellectual property of BOOKMYLOOK PRIVATE LIMITED. Unauthorized use, distribution, or reproduction of this content without express written consent is prohibited. Users retain ownership of content they upload, but grant BOOKMYLOOK PRIVATE LIMITED a license to use/process/modify the content as per GDPR's Article 6(1)(b).
            </p>
          </section>

          {/* Download or Sharing Restrictions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Download or Sharing Restrictions (DMCA, GDPR)</h2>
            <p className="text-gray-700">
              Users may not download or share media content unless explicitly permitted. Any such use must comply with applicable copyright laws and the terms of this agreement.
            </p>
          </section>

          {/* AI Content Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Content Disclaimer (GDPR, AI Act)</h2>
            <p className="text-gray-700">
              AI-generated content is provided for informational purposes only. While we aim for accuracy, we disclaim any liability for errors or omissions in AI-generated outputs, as per GDPR's principle of accountability.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to These Terms</h2>
            <p className="text-gray-700 mb-4">
              The Owner reserves the right to amend or otherwise modify these Terms at any time. In such cases, the Owner will appropriately inform the User of these changes.
            </p>
            <p className="text-gray-700">
              The User's continued use of the Website and/or the Service will signify the User's acceptance of the revised Terms. Failure to accept the revised Terms may entitle either party to terminate the Agreement.
            </p>
          </section>

          {/* Assignment */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Assignment of Contract</h2>
            <p className="text-gray-700">
              The Owner reserves the right to transfer, assign, dispose, or subcontract any or all rights under these Terms. Users may not assign or transfer their rights or obligations under these Terms in any way without the written permission of the Owner.
            </p>
          </section>

          {/* Contacts */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contacts</h2>
            <p className="text-gray-700">
              All communications relating to the use of this Website must be sent using the contact information stated in this document.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Severability</h2>
            <p className="text-gray-700">
              Should any of these Terms be deemed or become invalid or unenforceable under applicable law, the invalidity or unenforceability of such provision shall not affect the validity of the remaining provisions, which shall remain in full force and effect.
            </p>
          </section>

          {/* About Us */}
          <section className="bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">About Us</h2>
            <p className="text-gray-700 mb-4 italic font-medium">
              "Skip the wait, book your beauty date on BookMyLook"
            </p>
            <p className="text-gray-700">
              At BOOKMYLOOK we are revolutionizing the salon industry by leveraging technology for both clients and service providers.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
