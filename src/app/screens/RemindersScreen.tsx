import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { ReminderSettings } from '../types';

// Funny reminder messages
const REMINDER_MESSAGES = [
  { emoji: '✨', title: 'Hey dreamer', text: 'Japan won\'t pay for itself. Drop at least $5 — that\'s already progress. Honestly.' },
  { emoji: '📱', title: 'Your piggy bank misses you', text: 'The dream is frozen. Maybe throw in a couple bucks? It promises not to be sad.' },
  { emoji: '🐿️', title: 'Small question', text: 'How much did you put toward your dream this week? Now add that money to the dream piggy bank. Yeah, like that.' },
  { emoji: '🌸', title: 'Reminder from the universe', text: 'Sakura season doesn\'t wait. But this team does — waiting. Help warm it up now?' },
  { emoji: '🎯', title: 'Serious talk', text: 'Can we discuss? What about the person who saved money and the one who did it? You\'re both.' },
  { emoji: '🧠', title: 'Morning thought', text: 'Woke up. Brushed teeth. But did you save for your dream? Come on, while they\'re still saving.' },
  { emoji: '⚡', title: 'Dreamboard reminds', text: 'Your dream is like a hungry cat. And it believes in you more than you do on Monday.' },
  { emoji: '🎈', title: 'Fact of the day', text: '$100 per month = many cups per year. Math isn\'t as scary as you thought.' },
  { emoji: '🌙', title: 'Evening check-in', text: 'How are you? Great? And I like to care. No? It\'s not too late. Perfect.' },
  { emoji: '💛', title: 'No judgment, but...', text: 'You haven\'t deposited in three days. Dreams don\'t disappear, they just get sadder. Seriously?' },
  { emoji: '🚀', title: 'Motivation moment', text: 'Every night you dream of Japan. You could be closer. Low = $10 seconds.' },
  { emoji: '🎁', title: 'Your piggy bank says', text: 'Kinda cool. Is that you passing by again? Maybe throw in something to mini celebrate?' },
];

const TIME_OPTIONS = [
  { value: '08:00', emoji: '☀️', label: '8:00', sublabel: 'Morning' },
  { value: '12:00', emoji: '🌤️', label: '12:00', sublabel: 'Midday' },
  { value: '18:00', emoji: '🌆', label: '18:00', sublabel: 'Evening' },
  { value: '21:00', emoji: '✨', label: '21:00', sublabel: 'Night' },
  { value: 'random', emoji: '🎲', label: 'Surprise', sublabel: 'Random' },
  { value: 'custom', emoji: '⏰', label: 'Custom', sublabel: 'Time' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'every2', label: 'Every 2 days' },
  { value: 'weekly', label: 'Once a week' },
  { value: 'weekdays', label: 'Weekdays only' },
];

export default function RemindersScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    schedule_type: 'daily',
    time_mode: '18:00',
    custom_time: null,
  });
  const [loading, setLoading] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(0);

  useEffect(() => {
    loadSettings();
    // Auto-rotate preview
    const interval = setInterval(() => {
      setCurrentPreview((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSettings = () => {
    try {
      const userId = user?.id || 'guest';
      const stored = localStorage.getItem(`dreamboard_${userId}_reminders`);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  };

  const saveSettings = async (newSettings: ReminderSettings) => {
    setLoading(true);
    try {
      const userId = user?.id || 'guest';
      localStorage.setItem(`dreamboard_${userId}_reminders`, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          // Send notification after permission granted
          const randomMessage = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
          
          new Notification(randomMessage.title, {
            body: randomMessage.text,
            icon: '/icon-192.png',
            badge: '/icon.svg',
            tag: 'dreamboard-test',
          });

          toast.success('Test notification sent!');
        } else {
          toast.error('Notification permission denied');
        }
      });
      return;
    }

    // Permission already granted, send notification
    const randomMessage = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
    
    const notification = new Notification(randomMessage.title, {
      body: randomMessage.text,
      icon: '/icon-192.png',
      badge: '/icon.svg',
      tag: 'dreamboard-test',
      requireInteraction: false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    toast.success('Test notification sent!');
  };

  return (
    <div className="min-h-screen pb-20 px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Settings */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h1 
                className="text-3xl md:text-4xl mb-2 md:mb-3" 
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
              >
                When to remind?
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Choose a convenient time — it will come as a real notification on your phone
              </p>
            </div>

            {/* Time of Day */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                TIME OF DAY
              </p>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {TIME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => saveSettings({ ...settings, time_mode: option.value })}
                    className={`rounded-xl p-3 md:p-4 transition-all ${
                      settings.time_mode === option.value
                        ? 'bg-[#B8935E] text-white'
                        : 'bg-muted/50 hover:bg-muted border border-border'
                    }`}
                  >
                    <div className="text-xl md:text-2xl mb-0.5 md:mb-1">{option.emoji}</div>
                    <div className="font-medium text-xs md:text-sm">{option.label}</div>
                    <div className="text-[10px] md:text-xs opacity-70">{option.sublabel}</div>
                  </button>
                ))}
              </div>

              {settings.time_mode === 'custom' && (
                <div className="mt-3 md:mt-4">
                  <input
                    type="time"
                    value={settings.custom_time || '19:00'}
                    onChange={(e) => saveSettings({ ...settings, custom_time: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base outline-none focus:border-primary transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Frequency */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                HOW OFTEN
              </p>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => saveSettings({ ...settings, schedule_type: option.value })}
                    className={`rounded-xl px-3 md:px-4 py-2.5 md:py-3 transition-all text-xs md:text-sm font-medium ${
                      settings.schedule_type === option.value
                        ? 'bg-[#B8935E] text-white'
                        : 'bg-muted/50 hover:bg-muted border border-border'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save & Test */}
            <div className="space-y-2 md:space-y-3">
              <button
                onClick={() => toast.success('Schedule saved!')}
                className="w-full bg-[#B8935E] hover:bg-[#A17D4A] text-white py-3 md:py-4 rounded-xl font-medium transition-colors text-sm md:text-base"
              >
                SAVE SCHEDULE →
              </button>
              <button
                onClick={sendTestNotification}
                className="w-full bg-card hover:bg-muted border border-border py-2.5 md:py-3 rounded-xl font-medium transition-colors text-xs md:text-sm"
              >
                SEND TEST NOTIFICATION
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <h2 
                className="text-3xl md:text-4xl mb-2 md:mb-3" 
                style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}
              >
                Notification preview
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                This is how it will look on the lock screen
              </p>
            </div>

            {/* Preview Card - Current */}
            <div className="bg-gradient-to-br from-muted/80 to-muted/50 border border-border rounded-2xl p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 md:w-12 h-10 md:h-12 bg-[#B8935E] rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                  {REMINDER_MESSAGES[currentPreview].emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-0.5 md:mb-1 text-sm md:text-base">
                    {REMINDER_MESSAGES[currentPreview].title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {REMINDER_MESSAGES[currentPreview].text}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground/60 mt-1.5 md:mt-2">
                    now at 18:00
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center pt-3 md:pt-4 border-t border-border">
                <p className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
                  ↓ NEXT MESSAGE
                </p>
              </div>
            </div>

            {/* All Reminders (Random) */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 md:mb-4">
                ALL REMINDERS (RANDOM)
              </p>
              <div className="space-y-2 md:space-y-3 max-h-[400px] md:max-h-[500px] overflow-y-auto">
                {REMINDER_MESSAGES.map((msg, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-7 md:w-8 h-7 md:h-8 bg-card rounded-lg flex items-center justify-center text-base md:text-lg flex-shrink-0">
                      {msg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs md:text-sm font-medium mb-0.5">{msg.title}</h4>
                      <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}