import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, Loader2, Bot, User, Minimize2, Maximize2, AlertTriangle, TrendingUp, Users, GraduationCap, Bell, Lightbulb, Activity, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { sendAIChatMessage } from '@/lib/ai';
import { useAuth } from '@/contexts/AuthContext';
import { useStudents } from '@/hooks/useStudents';
import { useAIAlerts } from '@/hooks/useAIAlerts';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: string[];
}

interface LiveFeedback {
  type: 'warning' | 'success' | 'info' | 'critical';
  message: string;
  action?: string;
}

export function AIChatbot() {
  const { profile } = useAuth();
  const universityId = (profile as any)?.university_id;
  const { students } = useStudents();
  const { alerts } = useAIAlerts();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI consultant for the University Admin Portal. I provide real-time insights, proactive recommendations, and help you optimize student success. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState<LiveFeedback[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate live metrics
  const atRiskCount = students.filter(s => s.risk_score >= 70).length;
  const warningCount = students.filter(s => s.risk_score >= 40 && s.risk_score < 70).length;
  const lowEngagementCount = students.filter(s => s.engagement_score < 40).length;
  const unreadAlerts = alerts.filter(a => !a.read).length;
  const totalStudents = students.length;

  // Generate live feedback based on current data
  useEffect(() => {
    const feedback: LiveFeedback[] = [];
    
    if (atRiskCount > 0) {
      feedback.push({
        type: 'critical',
        message: `${atRiskCount} students at critical risk require immediate attention`,
        action: 'Review at-risk students'
      });
    }
    
    if (lowEngagementCount > 3) {
      feedback.push({
        type: 'warning',
        message: `${lowEngagementCount} students have low engagement scores (<40%)`,
        action: 'Check engagement patterns'
      });
    }
    
    if (unreadAlerts > 5) {
      feedback.push({
        type: 'info',
        message: `You have ${unreadAlerts} unread alerts to review`,
        action: 'View alerts'
      });
    }

    const newLeads = students.filter(s => s.stage === 'lead').length;
    if (newLeads > 10) {
      feedback.push({
        type: 'success',
        message: `${newLeads} new leads awaiting processing`,
        action: 'Process leads'
      });
    }
    
    setLiveFeedback(feedback);
  }, [students, alerts, atRiskCount, lowEngagementCount, unreadAlerts]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendAIChatMessage(
        input.trim(),
        messages.map(m => ({ role: m.role, content: m.content })),
        universityId
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.response || 'I received your message but could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `I encountered an issue. Please try again. ${error?.message || ''}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: 'Show at-risk students', icon: AlertTriangle },
    { label: 'What are the active alerts?', icon: Bell },
    { label: 'How is enrollment performing?', icon: TrendingUp },
    { label: 'Suggest interventions', icon: Lightbulb },
    { label: 'Analyze engagement patterns', icon: Activity },
    { label: 'Program performance review', icon: GraduationCap },
  ];

  const consultantCapabilities = [
    'Real-time risk analysis & predictions',
    'Personalized intervention strategies',
    'Enrollment funnel optimization',
    'Student success forecasting',
    'Counselor workload balancing',
    'Proactive alert recommendations'
  ];

  const handleQuickAction = async (action: string) => {
    setInput(action);
    const userMessage: Message = {
      role: 'user',
      content: action,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await sendAIChatMessage(
        action,
        messages.map(m => ({ role: m.role, content: m.content })),
        universityId
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.response || 'No response received.',
        timestamp: new Date(),
        recommendations: data?.recommendations
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error?.message || 'Could not process your request'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleFeedbackAction = (action: string) => {
    handleQuickAction(action);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setIsFullscreen(true); }}
        className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all group"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {(atRiskCount > 0 || unreadAlerts > 0) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0A0E14] flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-white font-bold">{atRiskCount + unreadAlerts}</span>
          </span>
        )}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="bg-[#0A0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap">
            AI Consultant • Click to open
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 bg-[#0A0E14] border border-white/10 shadow-2xl transition-all duration-300",
      isFullscreen 
        ? "inset-0 rounded-none" 
        : "bottom-6 right-24 w-96 h-[600px] max-h-[80vh] rounded-xl"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Consultant</h3>
            <p className="text-xs text-gray-400">Real-time insights & recommendations</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 text-[10px]">LIVE</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className={cn(
        "flex",
        isFullscreen ? "h-[calc(100vh-65px)]" : "h-[calc(100%-65px)]"
      )}>
        {/* Main Chat Area */}
        <div className={cn(
          "flex flex-col",
          isFullscreen ? "flex-1" : "w-full"
        )}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "flex-row-reverse" : "",
                  isFullscreen && "max-w-4xl mx-auto w-full"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'user' 
                    ? "bg-orange-500/10" 
                    : "bg-gradient-to-br from-purple-500/20 to-cyan-500/20"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className={cn(
                  "rounded-lg p-3",
                  message.role === 'user'
                    ? "bg-orange-500/10 border border-orange-500/20 max-w-[80%]"
                    : "bg-white/5 border border-white/10 max-w-[85%]"
                )}>
                  <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-purple-400 mb-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Recommendations:
                      </p>
                      <div className="space-y-1">
                        {message.recommendations.map((rec, i) => (
                          <p key={i} className="text-xs text-gray-300">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className={cn(
                "flex gap-3",
                isFullscreen && "max-w-4xl mx-auto w-full"
              )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-sm text-gray-400">Analyzing data...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && !loading && (
            <div className={cn(
              "px-4 pb-3",
              isFullscreen && "max-w-4xl mx-auto w-full"
            )}>
              <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.label)}
                      disabled={loading}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 border border-white/5 hover:border-white/10"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={cn(
            "p-4 border-t border-white/10",
            isFullscreen && "max-w-4xl mx-auto w-full"
          )}>
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about students, risks, trends, or get recommendations..."
                className="bg-white/5 border-white/10 text-white text-sm"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white px-4"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Live Feedback (Fullscreen only) */}
        {isFullscreen && (
          <div className="w-80 border-l border-white/10 flex flex-col">
            {/* Live Metrics */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Metrics
                </h4>
                <Badge className="bg-green-500/20 text-green-400 text-[10px]">REAL-TIME</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-lg font-bold text-white">{totalStudents}</span>
                  </div>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-lg font-bold text-red-400">{atRiskCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">At Risk</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <span className="text-lg font-bold text-yellow-400">{warningCount}</span>
                  </div>
                  <p className="text-xs text-gray-500">Warning</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-400" />
                    <span className="text-lg font-bold text-white">{unreadAlerts}</span>
                  </div>
                  <p className="text-xs text-gray-500">Alerts</p>
                </div>
              </div>
            </div>

            {/* Live Feedback */}
            <div className="p-4 flex-1 overflow-y-auto">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Live Feedback
              </h4>
              <div className="space-y-2">
                {liveFeedback.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-sm text-gray-400">All systems healthy</p>
                    <p className="text-xs text-gray-500">No immediate actions needed</p>
                  </div>
                ) : (
                  liveFeedback.map((feedback, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-colors",
                        feedback.type === 'critical' && "bg-red-500/10 border-red-500/30",
                        feedback.type === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
                        feedback.type === 'info' && "bg-blue-500/10 border-blue-500/30",
                        feedback.type === 'success' && "bg-green-500/10 border-green-500/30"
                      )}
                      onClick={() => feedback.action && handleFeedbackAction(feedback.action)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          feedback.type === 'critical' && "bg-red-400",
                          feedback.type === 'warning' && "bg-yellow-400",
                          feedback.type === 'info' && "bg-blue-400",
                          feedback.type === 'success' && "bg-green-400"
                        )} />
                        <div className="flex-1">
                          <p className="text-xs text-white">{feedback.message}</p>
                          {feedback.action && (
                            <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" /> {feedback.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Capabilities */}
            <div className="p-4 border-t border-white/10">
              <h4 className="text-xs font-medium text-gray-500 mb-2">AI Capabilities</h4>
              <div className="space-y-1">
                {consultantCapabilities.map((cap, index) => (
                  <p key={index} className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-purple-400" /> {cap}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
