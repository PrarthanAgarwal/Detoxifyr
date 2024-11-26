import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RootState } from '@/store';
import { updateSettings } from '@/store/slices/settingsSlice';

const settingsSchema = z.object({
  playbackSpeed: z.number().min(0.25).max(2),
  maxVideos: z.number().min(1).max(10),
  autoplay: z.boolean(),
  notifications: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export const SettingsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const { register, handleSubmit } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: SettingsForm) => {
    dispatch(updateSettings(data));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Playback Speed</Label>
          <Slider
            {...register('playbackSpeed')}
            defaultValue={[settings.playbackSpeed]}
            max={2}
            min={0.25}
            step={0.25}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Maximum Videos per Session</Label>
          <Input
            type="number"
            {...register('maxVideos', { valueAsNumber: true })}
            min={1}
            max={10}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Autoplay</Label>
          <Switch {...register('autoplay')} />
        </div>

        <div className="flex items-center justify-between">
          <Label>Notifications</Label>
          <Switch {...register('notifications')} />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Save Settings
      </Button>
    </form>
  );
};