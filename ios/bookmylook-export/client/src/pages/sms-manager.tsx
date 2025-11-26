import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Send, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Archive, 
  Settings, 
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SMSLog {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  messageType: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  twilioMessageSid?: string;
  cost?: number;
  sentAt?: string;
  createdAt: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  description?: string;
  messageType: string;
  template: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface ScheduledSMS {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  messageType: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
}

interface SMSStats {
  totalSent: number;
  totalFailed: number;
  totalCost: number;
  messageTypeBreakdown: Array<{
    type: string;
    count: number;
    sent: number;
    failed: number;
  }>;
  recentActivity: SMSLog[];
}

export default function SMSManagerPage() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledSMS[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [sendForm, setSendForm] = useState({
    recipientPhone: '',
    recipientName: '',
    message: '',
    messageType: 'manual'
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    messageType: 'custom',
    template: '',
    variables: [] as string[]
  });

  const [scheduleForm, setScheduleForm] = useState({
    recipientPhone: '',
    recipientName: '',
    message: '',
    scheduledFor: '',
    messageType: 'scheduled'
  });

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, templatesRes, scheduledRes, statsRes] = await Promise.all([
        fetch('/api/sms/logs').then(r => r.json()),
        fetch('/api/sms/templates').then(r => r.json()),
        fetch('/api/sms/scheduled').then(r => r.json()),
        fetch('/api/sms/stats').then(r => r.json())
      ]);

      setLogs(logsRes);
      setTemplates(templatesRes);
      setScheduled(scheduledRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Error fetching SMS data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch SMS data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Send SMS
  const handleSendSMS = async () => {
    if (!sendForm.recipientPhone || !sendForm.message) {
      toast({
        title: 'Error',
        description: 'Phone number and message are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendForm)
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'SMS Sent',
          description: 'Message sent successfully!'
        });
        setSendForm({ recipientPhone: '', recipientName: '', message: '', messageType: 'manual' });
        fetchData();
      } else {
        toast({
          title: 'SMS Failed',
          description: result.error || 'Failed to send SMS',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send SMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create template
  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.template || !templateForm.messageType) {
      toast({
        title: 'Error',
        description: 'Name, template, and message type are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      toast({
        title: 'Template Created',
        description: 'SMS template created successfully!'
      });
      setTemplateForm({ name: '', description: '', messageType: 'custom', template: '', variables: [] });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Schedule SMS
  const handleScheduleSMS = async () => {
    if (!scheduleForm.recipientPhone || !scheduleForm.message || !scheduleForm.scheduledFor) {
      toast({
        title: 'Error',
        description: 'Phone, message, and scheduled time are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/sms/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });

      toast({
        title: 'SMS Scheduled',
        description: 'Message scheduled successfully!'
      });
      setScheduleForm({ recipientPhone: '', recipientName: '', message: '', scheduledFor: '', messageType: 'scheduled' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule SMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cancel scheduled SMS
  const handleCancelScheduled = async (id: string) => {
    try {
      await fetch(`/api/sms/scheduled/${id}`, { method: 'DELETE' });
      toast({
        title: 'Cancelled',
        description: 'Scheduled SMS cancelled successfully'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel scheduled SMS',
        variant: 'destructive'
      });
    }
  };

  // Send test SMS
  const handleTestSMS = async () => {
    const testPhone = prompt('Enter phone number for test SMS (e.g., 9797208011):');
    if (!testPhone) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone })
      });
      const result = await response.json();

      toast({
        title: result.success ? 'Test Sent' : 'Test Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test SMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, any> = {
      sent: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      failed: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      cancelled: { variant: 'outline', icon: XCircle, color: 'text-gray-600' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMS Management System</h1>
            <p className="text-gray-600">Comprehensive SMS notification management with permanent logging</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleTestSMS} variant="outline" size="sm">
              <Send className="w-4 h-4 mr-2" />
              Test SMS
            </Button>
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-600">₹{stats.totalCost.toFixed(4)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Templates</p>
                    <p className="text-2xl font-bold text-purple-600">{templates.length}</p>
                  </div>
                  <Archive className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send SMS
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message Logs
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* Send SMS Tab */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Send New SMS</CardTitle>
                <CardDescription>Send SMS messages with permanent logging</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Recipient Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="9797208011"
                      value={sendForm.recipientPhone}
                      onChange={(e) => setSendForm(prev => ({ ...prev, recipientPhone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Recipient Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={sendForm.recipientName}
                      onChange={(e) => setSendForm(prev => ({ ...prev, recipientName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageType">Message Type</Label>
                  <Select
                    value={sendForm.messageType}
                    onValueChange={(value) => setSendForm(prev => ({ ...prev, messageType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your SMS message here..."
                    value={sendForm.message}
                    onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    {sendForm.message.length}/160 characters
                  </p>
                </div>

                <Button onClick={handleSendSMS} disabled={loading} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send SMS'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="space-y-6">
              {/* Create Template */}
              <Card>
                <CardHeader>
                  <CardTitle>Create SMS Template</CardTitle>
                  <CardDescription>Create reusable SMS templates with variables</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input
                        id="templateName"
                        placeholder="Booking Confirmation"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="templateType">Message Type</Label>
                      <Select
                        value={templateForm.messageType}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, messageType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="promotional">Promotional</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateDescription">Description (Optional)</Label>
                    <Input
                      id="templateDescription"
                      placeholder="Template description..."
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateText">Template Text</Label>
                    <Textarea
                      id="templateText"
                      placeholder="Hi {{clientName}}, your booking for {{serviceName}} is confirmed for {{date}} at {{time}}. Token: {{token}}. Location: {{location}}."
                      value={templateForm.template}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, template: e.target.value }))}
                      rows={4}
                    />
                    <p className="text-sm text-gray-500">
                      Use {`{{variableName}}`} for dynamic content
                    </p>
                  </div>

                  <Button onClick={handleCreateTemplate} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>

              {/* Templates List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{template.messageType}</Badge>
                            <Badge variant="outline">{template.usageCount} uses</Badge>
                          </div>
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        )}
                        <p className="text-sm bg-gray-100 p-2 rounded">{template.template}</p>
                        {template.variables.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Variables: {template.variables.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled">
            <div className="space-y-6">
              {/* Schedule SMS */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule SMS</CardTitle>
                  <CardDescription>Schedule SMS messages for future delivery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedulePhone">Recipient Phone</Label>
                      <Input
                        id="schedulePhone"
                        placeholder="9797208011"
                        value={scheduleForm.recipientPhone}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, recipientPhone: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduleTime">Scheduled Time</Label>
                      <Input
                        id="scheduleTime"
                        type="datetime-local"
                        value={scheduleForm.scheduledFor}
                        onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduleMessage">Message</Label>
                    <Textarea
                      id="scheduleMessage"
                      placeholder="Your scheduled message..."
                      value={scheduleForm.message}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleScheduleSMS} disabled={loading}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule SMS
                  </Button>
                </CardContent>
              </Card>

              {/* Scheduled Messages List */}
              <Card>
                <CardHeader>
                  <CardTitle>Scheduled Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scheduled.map((sms) => (
                      <div key={sms.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{sms.recipientPhone}</span>
                            <StatusBadge status={sms.status} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {new Date(sms.scheduledFor).toLocaleString()}
                            </span>
                            {sms.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelScheduled(sms.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm">{sms.message}</p>
                        {sms.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">Error: {sms.errorMessage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>SMS Message Logs</CardTitle>
                <CardDescription>Permanent record of all SMS communications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{log.recipientPhone}</span>
                          {log.recipientName && (
                            <span className="text-sm text-gray-600">({log.recipientName})</span>
                          )}
                          <StatusBadge status={log.status} />
                          <Badge variant="outline">{log.messageType}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm mb-2">{log.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          {log.twilioMessageSid && (
                            <span>SID: {log.twilioMessageSid}</span>
                          )}
                          {log.cost && (
                            <span>Cost: ₹{log.cost}</span>
                          )}
                        </div>
                        {log.sentAt && (
                          <span>Sent: {new Date(log.sentAt).toLocaleString()}</span>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">Error: {log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {stats && (
                <>
                  {/* Message Type Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.messageTypeBreakdown.map((item) => (
                          <div key={item.type} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-semibold capitalize">{item.type.replace('_', ' ')}</h3>
                              <p className="text-sm text-gray-600">Total: {item.count} messages</p>
                            </div>
                            <div className="flex gap-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-green-600">{item.sent}</p>
                                <p className="text-xs text-gray-500">Sent</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-red-600">{item.failed}</p>
                                <p className="text-xs text-gray-500">Failed</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.recentActivity.map((log) => (
                          <div key={log.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <StatusBadge status={log.status} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{log.recipientPhone}</p>
                              <p className="text-xs text-gray-500">{log.message.substring(0, 50)}...</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}