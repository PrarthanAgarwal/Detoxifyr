import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RootState } from '@/store';
import { startSession, endSession } from '@/store/slices/sessionSlice';
import { PlayCircle, StopCircle } from 'lucide-react';

export const SessionManager: React.FC = () => {
  const dispatch = useDispatch();
  const currentSession = useSelector(
    (state: RootState) => state.session.currentSession
  );
  const settings = useSelector((state: RootState) => state.settings);

  const handleStartSession = () => {
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

  const handleEndSession = () => {
    dispatch(endSession());
  };

  const progress =
    currentSession?.videosWatched.length ?? 0 / settings.maxVideos * 100;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Session Control</h2>
        {currentSession ? (
          <Button
            variant="destructive"
            onClick={handleEndSession}
            className="flex items-center gap-2"
          >
            <StopCircle className="h-4 w-4" />
            End Session
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={handleStartSession}
            className="flex items-center gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            Start Session
          </Button>
        )}
      </div>

      {currentSession && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {currentSession.videosWatched.length} / {settings.maxVideos} videos
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
};