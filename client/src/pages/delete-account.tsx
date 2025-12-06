import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Mail, Shield, Trash2, User } from "lucide-react";
import DeleteAccountButton from "@/components/delete-account-button";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DeleteAccount() {
  // Check if user is logged in
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/clients/current"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                BookMyLook
              </h1>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Deletion</h1>
          <p className="text-lg text-gray-600">
            Permanently delete your BookMyLook account and all associated data
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* What Gets Deleted */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                What Will Be Deleted
              </CardTitle>
              <CardDescription>
                The following information will be permanently removed:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Personal Information</p>
                  <p className="text-sm text-gray-600">Name, email, phone number, and profile data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Account Data</p>
                  <p className="text-sm text-gray-600">Login credentials and account settings</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium text-sm">Activity History</p>
                  <p className="text-sm text-gray-600">Bookings, provider information, portfolio, and communication history</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This action cannot be undone. Most data is deleted immediately, with complete processing within 7 business days.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Deletion Process */}
          <Card>
            <CardHeader>
              <CardTitle>How to Delete Your Account</CardTitle>
              <CardDescription>
                Follow these steps to permanently delete your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Checking login status...</p>
                </div>
              ) : user ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>Logged in as:</strong> {user.firstName} {user.lastName} ({user.email})
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    You are currently logged in. Click the button below to permanently delete your account and all associated data.
                  </p>
                  <DeleteAccountButton 
                    variant="destructive" 
                    size="lg" 
                    className="w-full"
                    data-testid="button-delete-account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account Permanently
                  </DeleteAccountButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    You need to be logged in to delete your account. Please log in first.
                  </p>
                  <Link href="/login?next=/delete-account">
                    <Button className="w-full" size="lg" data-testid="button-login-to-delete">
                      <User className="w-4 h-4 mr-2" />
                      Log In to Delete Account
                    </Button>
                  </Link>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Can't access your account?</strong>
                    </p>
                    <Card className="bg-gray-50">
                      <CardContent className="pt-4">
                        <h4 className="font-medium text-sm mb-3">Request Account Deletion</h4>
                        <form className="space-y-3" data-testid="form-deletion-request">
                          <div>
                            <label className="text-xs text-gray-600">Full Name</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 text-sm border rounded-md" 
                              placeholder="Your full name"
                              required
                              data-testid="input-full-name"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Email Address</label>
                            <input 
                              type="email" 
                              className="w-full px-3 py-2 text-sm border rounded-md" 
                              placeholder="Email associated with your account"
                              required
                              data-testid="input-email"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Phone Number (if provided during registration)</label>
                            <input 
                              type="tel" 
                              className="w-full px-3 py-2 text-sm border rounded-md" 
                              placeholder="Phone number (optional)"
                              data-testid="input-phone"
                            />
                          </div>
                          <Button type="submit" className="w-full" size="sm" data-testid="button-submit-deletion-request">
                            Submit Deletion Request
                          </Button>
                        </form>
                        <p className="text-xs text-gray-500 mt-3">
                          We'll verify your identity and complete deletion within 7 business days. You'll receive confirmation via email.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-500">
                        Alternative: Email us at{" "}
                        <a 
                          href="mailto:support@bookmylook.net?subject=Account Deletion Request"
                          className="text-purple-600 hover:text-purple-700 underline"
                          data-testid="link-email-support"
                        >
                          support@bookmylook.net
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Processing Timeline</h4>
                <p className="text-sm text-gray-600">
                  Account deletion begins immediately. Complete removal from all systems (including backups) is finished within 7 business days. You'll receive email confirmation when processing is complete.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Data Retention Policy</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Immediately Deleted:</strong> Personal profile, preferences, most booking and communication history.</p>
                  <p><strong>Retained for Legal Compliance:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Financial transaction records: 7 years (tax compliance)</li>
                    <li>Fraud prevention logs: 12 months (security purposes)</li>
                    <li>Anonymized analytics data: 24 months (business insights, no personal identifiers)</li>
                  </ul>
                  <p><strong>Third-Party Services:</strong> Payment data with Stripe is deleted/anonymized according to their retention policy. SMS history with Twilio is purged within 30 days.</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600">
                  Before deleting your account, consider if you just need to update your preferences or take a break from the service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline" data-testid="button-back-home">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}