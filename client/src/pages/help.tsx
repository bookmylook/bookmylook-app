import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Help() {
  const [, setLocation] = useLocation();

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "Click on 'Book Now' from the home page, select your preferred service and provider, choose a date and time that works for you, and confirm your booking. You'll receive an SMS confirmation instantly."
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer: "Yes, you can cancel or reschedule your appointment from the 'My Bookings' page. Please do so at least 2 hours before your scheduled time to avoid any cancellation fees."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept online payments only during booking. You can pay using UPI (PhonePe, GPay, Paytm, BHIM), credit/debit cards, or net banking for secure and instant confirmation of your appointment."
    },
    {
      question: "How do I become a service provider?",
      answer: "Click on 'Become a Provider' from the menu, fill out the registration form with your business details, and submit. Our team will review your application and get back to you within 24-48 hours."
    },
    {
      question: "Are the providers verified?",
      answer: "Yes, all providers on BookMyLook are verified by our team. We check their credentials, business licenses, and portfolio to ensure quality service."
    },
    {
      question: "How flexible is the scheduling?",
      answer: "Unlike other platforms with fixed time slots, BookMyLook offers flexible scheduling. You can book appointments at any time that works for both you and the provider - no rigid 30-minute or 1-hour slots."
    },
    {
      question: "Will I get booking confirmations?",
      answer: "Yes, both you and the service provider will receive SMS confirmations immediately after booking. You'll also receive reminder messages before your appointment."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "Your satisfaction is our priority. If you're not happy with a service, please contact us at info@bookmylook.net or call 9906145666. We'll work with you to resolve the issue."
    },
    {
      question: "How do I choose a provider?",
      answer: "Browse provider profiles to see their services, portfolios, and business information. You can view their work, specialties, and available services to help you make an informed decision."
    },
    {
      question: "Is there a minimum booking amount?",
      answer: "No, there's no minimum booking amount. You can book any service regardless of the price. Each provider sets their own service rates."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach us via email at info@bookmylook.net or call us at 9906145666. Our support team is available from 9:00 AM to 8:00 PM daily."
    },
    {
      question: "Can I book for someone else?",
      answer: "Yes, you can book appointments for family members or friends. Just make sure to provide accurate contact information during booking."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 pb-20">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-purple-600 mb-4">
            Help & FAQ
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-purple-600" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Browse through our most commonly asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex items-center gap-3"
                onClick={() => setLocation('/contact')}
                data-testid="button-contact"
              >
                <Mail className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-semibold">Email Support</div>
                  <div className="text-sm text-gray-600">info@bookmylook.net</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex items-center gap-3"
                onClick={() => window.location.href = 'tel:9906145666'}
                data-testid="button-phone"
              >
                <Phone className="h-5 w-5 text-pink-600" />
                <div className="text-left">
                  <div className="font-semibold">Phone Support</div>
                  <div className="text-sm text-gray-600">9906145666</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
