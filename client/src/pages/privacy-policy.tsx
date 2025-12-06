import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - BookMyLook";
    
    const title = "Privacy Policy - BookMyLook";
    const description = "Learn how BookMyLook protects your privacy and handles your personal data. Our comprehensive privacy policy covers data collection, usage, and your rights.";
    const url = window.location.origin + "/privacy-policy";
    
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
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Privacy Policy</h1>
          
          {/* Privacy Policy Section */}
          <div className="mb-12">
            <div className="prose prose-gray max-w-none space-y-6">
              <p className="text-gray-700 mb-6">
                Welcome to https://bookmylook.net (the "Site"). We understand that privacy online is important to users of our Site, especially when conducting business. This statement governs our privacy policies concerning those users of the Site ("Visitors") who visit without transacting business and Visitors who register to transact business on the Site and make use of the various services offered by BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" (collectively, "Services").
              </p>
              
              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Personally Identifiable Information</h3>
                <p className="text-gray-700">
                  Refers to any information that can be used to identify, contact, or locate the person to whom such information pertains, including, but not limited to, name, address, phone number, fax number, email address, financial profile, social security number, and credit card information. Personally Identifiable Information does not include information that is collected anonymously (that is, without identification of the individual user) or demographic information not connected to an identified individual.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">What Personally Identifiable Information is collected?</h3>
                <p className="text-gray-700">
                  We may collect basic user profile information from all of our Visitors. We collect the following additional information from our Authorized Customers: the name, email address, phone number, address, social media profile information.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">What organizations are collecting the information?</h3>
                <p className="text-gray-700">
                  In addition to our direct collection of information, our third-party service vendors (such as credit card companies, clearinghouses, and banks) who may provide such services as credit, insurance, and escrow services may collect this information from our Visitors and Authorized Customers. We do not control how these third parties use such information, but we do ask them to disclose how they use personal information provided to them by Visitors and Authorized Customers. Some of these third parties may be intermediaries that act solely as links in the distribution chain and do not store, retain, or use the information given to them.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">How does the Site use Personally Identifiable Information?</h3>
                <p className="text-gray-700">
                  We use Personally Identifiable Information to customize the Site, make appropriate service offerings, and fulfill buying and selling requests on the Site. We may email Visitors and Authorized Customers about research or purchase and selling opportunities on the Site or information related to the subject matter of the Site. We may also use Personally Identifiable Information to contact Visitors and Authorized Customers in response to specific inquiries or to provide requested information.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">With whom may the information be shared?</h3>
                <p className="text-gray-700">
                  Personally Identifiable Information about Authorized Customers may be shared with other Authorized Customers who wish to evaluate potential transactions with other Authorized Customers. We may share aggregated information about our Visitors, including the demographics of our Visitors and Authorized Customers, with our affiliated agencies and third-party vendors. We also offer the opportunity to "opt-out" of receiving information or being contacted by us or by any agency acting on our behalf.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">How is Personally Identifiable Information stored?</h3>
                <p className="text-gray-700">
                  Personally Identifiable Information collected by BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" is securely stored and is not accessible to third parties or employees of BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" except for use as indicated above.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">What choices are available to Visitors regarding the information's collection, use, and distribution?</h3>
                <p className="text-gray-700">
                  Visitors and Authorized Customers may opt-out of receiving unsolicited information from or being contacted by us and/or our vendors and affiliated agencies by responding to emails as instructed, or by contacting us at <a href="mailto:info@bookmylook.net" className="text-blue-600 hover:underline">info@bookmylook.net</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Google AdSense & DoubleClick Cookie</h3>
                <p className="text-gray-700">
                  Google, as a third-party vendor, uses cookies to advertise our service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Cookies</h3>
                <p className="text-gray-700 mb-3">
                  A cookie is a string of information that a website stores on a visitor's computer, and that the visitor's browser provides to the website each time the visitor returns.
                </p>
                <p className="text-gray-700">
                  We use "cookies" to collect information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Are Cookies Used on the Site?</h3>
                <p className="text-gray-700">
                  Cookies are used for a variety of reasons. We use Cookies to obtain information about the preferences of our Visitors and the services they select. We also use Cookies for security purposes to protect our Authorized Customers. For example, if an Authorized Customer is logged on and the site is unused for more than 10 minutes, we will automatically log the Authorized Customer off. Visitors who do not wish to have cookies placed on their computers should set their browsers to refuse cookies before using the Site.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Cookies used by our service providers</h3>
                <p className="text-gray-700">
                  Our service providers use cookies, and those cookies may be stored on your computer when you visit our website.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">How does BOOKMYLOOK PRIVATE LIMITED use login information?</h3>
                <p className="text-gray-700">
                  BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" uses login information, including, but not limited to, IP addresses, ISPs, and browser types, browser versions, pages visited, date and time of visit, to analyze trends, administer the Site, track a user's movement and use, and gather broad demographic information.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">What partners or service providers have access to Personally Identifiable Information from Visitors and/or Authorized Customers on the Site?</h3>
                <p className="text-gray-700">
                  BOOKMYLOOK PRIVATE LIMITED, doing business as "BOOKMYLOOK" has entered into and will continue to enter into partnerships and other affiliations with a number of vendors. Such vendors may have access to certain Personally Identifiable Information on a need to know the basis for evaluating Authorized Customers for service eligibility. Our privacy policy does not cover their collection or use of this information.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">How does the Site keep Personally Identifiable Information secure?</h3>
                <p className="text-gray-700">
                  All of our employees are familiar with our security policy and practices. The Personally Identifiable Information of our Visitors and Authorized Customers is only accessible to a limited number of qualified employees who are given a password in order to gain access to the information. We audit our security systems and processes on a regular basis. Sensitive information, such as credit card numbers or social security numbers, is protected by encryption protocols, in place to protect information sent over the Internet.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">How can Visitors correct any inaccuracies in Personally Identifiable Information?</h3>
                <p className="text-gray-700">
                  Visitors and Authorized Customers may contact us to update their Personally Identifiable Information at <a href="mailto:info@bookmylook.net" className="text-blue-600 hover:underline">info@bookmylook.net</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Can a Visitor delete or deactivate Personally Identifiable Information collected by the Site?</h3>
                <p className="text-gray-700">
                  We provide Visitors and Authorized Customers with a mechanism to delete/deactivate Personally Identifiable Information from the Site's database by contacting them. However, because of backups and records of deletions, it may be impossible to delete a Visitor's entry without retaining some residual information. An individual who requests to have Personally Identifiable Information deactivated will have this information functionally deleted, and we will not sell, transfer, or use Personally Identifiable Information relating to that individual in any way moving forward.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Rights</h3>
                <p className="text-gray-700 mb-3">These are summarized rights that you have under data protection law:</p>
                <ul className="list-disc list-inside text-gray-700 ml-4 space-y-2">
                  <li>The right to access</li>
                  <li>The right to rectification</li>
                  <li>The right to erasure</li>
                  <li>The right to restrict processing</li>
                  <li>The right to object to processing</li>
                  <li>The right to data portability</li>
                  <li>The right to complain to a supervisory authority</li>
                  <li>The right to withdraw consent</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Children's Privacy</h3>
                <p className="text-gray-700">
                  Our Service does not address "Children", anyone under the age of 18 years, and we do not knowingly collect personally identifiable information from children under 18 years.
                </p>
                <p className="text-gray-700 mt-3">
                  If you are a parent or guardian and you are aware that your child has provided us with Personal Information, please get in touch with us immediately using the contact details provided. If we come to know that children below 18 years have provided personal information, we will delete the information from our servers immediately.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Compliance With Laws</h3>
                <p className="text-gray-700">
                  Disclosure of Personally Identifiable Information to comply with the law. We will disclose Personally Identifiable Information in order to comply with a court order subpoena or a request from a law enforcement agency to release information. We will also disclose Personally Identifiable Information when reasonably necessary to protect the safety of our Visitors and Authorized Customers.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">What happens if the Privacy Policy Changes?</h3>
                <p className="text-gray-700">
                  We will let our Visitors and Authorized Customers know about changes to our privacy policy by posting such changes on the Site. However, if we are changing our privacy policy in a manner that might cause disclosure of Personally Identifiable Information that a Visitor or Authorized Customer has previously requested not be disclosed, we will contact such Visitor or Authorized Customer to allow such Visitor or Authorized Customer to prevent such disclosure.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Links</h3>
                <p className="text-gray-700">
                  https://bookmylook.net contains links to other websites. Please note that when you click on one of these links, you are moving to another website. We encourage you to read the privacy statements of these linked sites as their privacy policies may differ from ours.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h3>
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy, get in touch with us at <a href="mailto:info@bookmylook.net" className="text-blue-600 hover:underline">info@bookmylook.net</a>
                </p>
              </section>
            </div>
          </div>

          {/* Pricing & Refund Policy Section */}
          <div className="border-t-2 border-gray-200 pt-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Pricing & Refund Policy</h2>
            <p className="text-lg text-gray-600 text-center mb-8">BookMyLook Private Limited</p>
            
            <div className="prose prose-gray max-w-none space-y-8">
              <p className="text-gray-600 mb-8">This Pricing & Refund Policy ("Policy") governs the terms relating to service charges and refunds applicable to transactions conducted through the website and mobile application operated by BookMyLook Private Limited ("Company", "we", "our", or "us"). By accessing or using our platform, you ("Customer", "User", or "you") agree to the terms outlined herein.</p>
              
              <section>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">1. Pricing Policy</h3>
                
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">1.1 Commission Charges</h4>
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
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">1.2 Transparency of Charges</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>1.2.1</strong> All applicable charges shall be displayed clearly at the time of checkout, prior to payment confirmation.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong>1.2.2</strong> No hidden charges shall be levied by the Company, other than those expressly stated.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">1.3 Taxes</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>1.3.1</strong> Government taxes, including but not limited to Goods and Services Tax (GST), if applicable, shall be charged in addition to the service fee.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">1.4 Right to Revision</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>1.4.1</strong> The Company reserves the right to revise, amend, or update the Pricing Policy at any time without prior notice.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong>1.4.2</strong> Any such revision shall be deemed effective upon publication on the website and/or mobile application.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">2. Refund Policy</h3>
                
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">2.1 General Provisions</h4>
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
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">2.2 Conditions for Refund Eligibility</h4>
                  
                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2">a. Service Provider Denial After Approval</h5>
                    <p className="text-gray-700 mb-3">
                      <strong>2.2.1</strong> In the event a booking is initially accepted/approved by a service provider but subsequently cancelled or denied by the same service provider, the Customer shall be entitled to a full refund of the payment made online.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2">b. Excessive Waiting Time</h5>
                    <p className="text-gray-700 mb-3">
                      <strong>2.2.2</strong> In the event a Customer is required to wait for more than ten (10) minutes at the service location without commencement of service, the Customer may raise a refund request.
                    </p>
                    <p className="text-gray-700 mb-3">
                      <strong>2.2.3</strong> Such a request must be reported to the Company on the same day through the website, application, or customer support.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2">c. Customer-Initiated Cancellation</h5>
                    <p className="text-gray-700 mb-3">
                      <strong>2.2.4</strong> Where a Customer cancels a confirmed booking, such Customer must inform the service provider not less than one (1) hour prior to the scheduled appointment time in order to qualify for a refund.
                    </p>
                    <p className="text-gray-700 mb-3">
                      <strong>2.2.5</strong> Cancellations notified less than one (1) hour prior to the appointment shall render the Customer ineligible for a refund.
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">2.3 Refund Procedure</h4>
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
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">2.4 Non-Refundable Situations</h4>
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
                  <h4 className="text-xl font-semibold text-gray-800 mb-3">2.5 Policy Amendments</h4>
                  <p className="text-gray-700 mb-3">
                    <strong>2.5.1</strong> The Company reserves the right to modify, amend, or revise this Refund Policy at any time without prior notice.
                  </p>
                  <p className="text-gray-700 mb-3">
                    <strong>2.5.2</strong> Any modification shall become effective immediately upon being published on the website and/or mobile application.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">3. Governing Law</h3>
                <p className="text-gray-600">
                  This Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in relation to this Policy shall be subject to the exclusive jurisdiction of the courts situated at Srinagar, Jammu & Kashmir, India.
                </p>
              </section>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Having trouble viewing the policy? <a href="https://bookmylook.net/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open in new tab</a></p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}