import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RootState } from '@/store';
import { startSession } from '@/store/slices/sessionSlice';
import { updateSettings } from '@/store/slices/settingsSlice';
import { Clock, History, Play, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { checkAuthStatus } from '@/utils/auth';
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export const DetoxPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const settings = useSelector((state: RootState) => state.settings);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    checkAuthStatus().then(setIsAuthenticated);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      chrome.identity.getProfileUserInfo((userInfo) => {
        console.log('User Info:', userInfo);
        if (userInfo && userInfo.email) {
          setUserEmail(userInfo.email);
        }
      });
    }
  }, [isAuthenticated]);

  const handleStartSession = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a detox session",
        variant: "destructive"
      });
      return;
    }

    dispatch(
      startSession({
        id: crypto.randomUUID(),
        startTime: Date.now(),
        keywords: settings.keywords,
        playbackSpeed: settings.playbackSpeed,
        maxVideos: settings.maxVideos,
        videosWatched: [],
        isActive: true,
      })
    );
  };

  const handleGoogleSignIn = async () => {
    try {
      chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly']
      }, function(token) {
        if (chrome.runtime.lastError) {
          console.error('Auth Error:', chrome.runtime.lastError);
          toast({
            title: "Authentication failed",
            description: "Please check your OAuth client ID configuration",
            variant: "destructive"
          });
          return;
        }
        
        if (token) {
          setIsAuthenticated(true);
          chrome.storage.local.set({ authToken: token }, () => {
            toast({
              title: "Successfully signed in",
              description: "You can now start your detox session"
            });
          });
        }
      });
    } catch (error) {
      console.error('Auth Error:', error);
      toast({
        title: "Authentication failed",
        description: "Invalid OAuth client ID configuration",
        variant: "destructive"
      });
    }
  };

  const handleKeywordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentKeyword.trim()) {
      e.preventDefault(); // Prevent form submission
      
      // Only add if we have less than 5 keywords and it's not a duplicate
      if (settings.keywords.length < 5 && !settings.keywords.includes(currentKeyword.trim())) {
        dispatch(
          updateSettings({
            keywords: [...settings.keywords, currentKeyword.trim()]
          })
        );
        setCurrentKeyword(''); // Clear the input
      } else if (settings.keywords.length >= 5) {
        toast({
          title: "Maximum keywords reached",
          description: "You can only add up to 5 keywords",
          variant: "destructive"
        });
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    dispatch(
      updateSettings({
        keywords: settings.keywords.filter(k => k !== keywordToRemove)
      })
    );
  };

  const handleLogout = () => {
    chrome.identity.clearAllCachedAuthTokens(() => {
      setIsAuthenticated(false);
      setUserEmail('');
      chrome.storage.local.remove('authToken');
      toast({
        title: "Logged out",
        description: "Successfully signed out"
      });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">YouTube Detoxifyr</h1>
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full w-8 h-8 bg-[#2a2f3e] hover:bg-[#3a3f4e] transition-colors"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-[#1a1f2e] text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a1f2e] border-[#2a2f3e]">
                <DropdownMenuItem className="focus:bg-[#2a2f3e] cursor-default">
                  <div className="flex flex-col space-y-1 w-full">
                    <p className="text-sm font-medium text-white">Account</p>
                    {userEmail ? (
                      <p className="text-xs text-gray-400">{userEmail}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Loading...</p>
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2f3e]" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 focus:text-red-400 focus:bg-[#2a2f3e] cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Keywords Input */}
          <div className="space-y-2">
            <Label>Keywords (Press 'Enter' - Max 5)</Label>
            <Input 
              placeholder="Enter keywords"
              className="bg-[#1a1f2e] border-[#2a2f3e]"
              value={currentKeyword}
              onChange={(e) => setCurrentKeyword(e.target.value)}
              onKeyDown={handleKeywordInput}
              disabled={settings.keywords.length >= 5}
            />
          </div>

          {/* Keywords display */}
          <div className="flex flex-wrap gap-2">
            {settings.keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center bg-[#2563eb] px-3 py-1.5 rounded-md text-sm"
              >
                {keyword}
                <span
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 cursor-pointer text-xs opacity-80 hover:opacity-100"
                >
                  ×
                </span>
              </div>
            ))}
          </div>

          {/* Video Duration Slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Label>Video Duration: {settings.maxDuration} min</Label>
            </div>
            <Slider 
              value={[settings.maxDuration]}
              max={60}
              min={5}
              step={5}
              onValueChange={([value]) => 
                dispatch(updateSettings({ maxDuration: value }))
              }
              className="w-full"
            />
          </div>

          {/* Number of Videos Input */}
          <div className="space-y-2">
            <Label>Number of Videos</Label>
            <Input 
              type="number"
              value={settings.maxVideos}
              onChange={(e) => 
                dispatch(updateSettings({ maxVideos: parseInt(e.target.value) }))
              }
              min={1}
              max={10}
              className="bg-[#2a2f3e] border-none"
            />
          </div>

          {/* Playback Speed */}
          <div className="space-y-2">
            <Label>Playback Speed</Label>
            <ToggleGroup
              type="single"
              value={settings.playbackSpeed.toString()}
              onValueChange={(value) => {
                if (value) { // Check if value exists as ToggleGroup can return undefined
                  dispatch(updateSettings({ playbackSpeed: parseFloat(value) }));
                }
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="1" className="flex-1">
                1x
              </ToggleGroupItem>
              <ToggleGroupItem value="1.5" className="flex-1">
                1.5x
              </ToggleGroupItem>
              <ToggleGroupItem value="2" className="flex-1">
                2x
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {!isAuthenticated ? (
          <Button
            variant="default"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={handleGoogleSignIn}
          >
            Sign In
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 border-[#2a2f3e] text-black hover:text-white"
              onClick={() => {/* Show history */}}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button
              variant="default"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleStartSession}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Detox
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};