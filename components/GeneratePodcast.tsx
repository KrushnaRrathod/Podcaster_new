import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader } from 'lucide-react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { useUploadFiles } from '@xixixao/uploadstuff/react';
import { cn } from '@/lib/utils';
import { GeneratePodcastProps } from '@/types';

// Custom hook to handle audio generation and upload
const useGeneratePodcast = ({
  setAudio, voiceType, voicePrompt, setAudioStorageId
}: GeneratePodcastProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl);

  const getPodcastAudio = useAction(api.openai.generateAudioAction);
  const getAudioUrl = useMutation(api.podcasts.getUrl);

  const generatePodcast = async () => {
    setIsGenerating(true);
    setAudio('');

    if (!voicePrompt) {
      toast({
        title: "Please provide a voicePrompt to generate a podcast",
      });
      setIsGenerating(false);
      return;
    }

    try {
      const response = await getPodcastAudio({
        voice: voiceType,
        input: voicePrompt,
      });

      const blob = new Blob([response], { type: 'audio/mpeg' });
      const fileName = `podcast-${uuidv4()}.mp3`;
      const file = new File([blob], fileName, { type: 'audio/mpeg' });

      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;

      setAudioStorageId(storageId);

      const audioUrl = await getAudioUrl({ storageId });
      setAudio(audioUrl!);
      setIsGenerating(false);
      toast({
        title: "Podcast generated successfully",
      });
    } catch (error) {
      console.log('Error generating podcast', error);
      toast({
        title: "Error creating a podcast",
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  };

  return { isGenerating, generatePodcast };
};

const useUploadAudio = (setAudio: any, setAudioStorageId: any) => {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const { startUpload } = useUploadFiles(generateUploadUrl);
  const getAudioUrl = useMutation(api.podcasts.getUrl);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploaded = await startUpload([file]);
      const storageId = (uploaded[0].response as any).storageId;

      setAudioStorageId(storageId);

      const audioUrl = await getAudioUrl({ storageId });
      setAudio(audioUrl!);
    }
  };

  return { handleAudioUpload };
};

const GeneratePodcast = (props: GeneratePodcastProps) => {
  const { isGenerating, generatePodcast } = useGeneratePodcast(props);
  const { handleAudioUpload } = useUploadAudio(props.setAudio, props.setAudioStorageId);
  const [isAiAudio, setIsAiAudio] = useState(true);
  const audioRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <div className='generate_thumbnail'>
        <Button
          type='button'
          variant='plain'
          onClick={() => setIsAiAudio(true)}
          className={cn('', {
            'bg-black-6': isAiAudio
          })}
        >
          Use AI to generate audio
        </Button>
        <Button
          type='button'
          variant='plain'
          onClick={() => setIsAiAudio(false)}
          className={cn('', {
            'bg-black-6': !isAiAudio
          })}
        >
          Upload custom audio
        </Button>
      </div>
      {isAiAudio ? (
        <div>
          <div className="mt-5 flex flex-col gap-2.5">
            <Label className="text-16 font-bold text-white-1">
              AI Prompt to generate Podcast
            </Label>
            <Textarea
              className="input-class font-light focus-visible:ring-offset-orange-1"
              placeholder='Provide text to generate audio'
              rows={5}
              value={props.voicePrompt}
              onChange={(e) => props.setVoicePrompt(e.target.value)}
            />
          </div>
          <div className="mt-5 w-full max-w-[200px]">
            <Button type="submit" className="text-16 bg-orange-1 py-4 font-bold text-white-1" onClick={generatePodcast}>
              {isGenerating ? (
                <>
                  Generating
                  <Loader size={20} className="animate-spin ml-2" />
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="image_div" onClick={() => audioRef.current?.click()}>
          <Input
            type="file"
            className="hidden"
            ref={audioRef}
            onChange={handleAudioUpload}
            accept="audio/*"
          />
          {!props.audio ? (
            <div className="flex flex-col items-center gap-1">
            <h2 className="text-12 font-bold text-orange-1">
             Click to upload
             </h2>
             <p className="text-12 font-normal text-gray-1">MP3</p> 
           </div>
          ) : (
            <div></div>
          )}
        </div>
      )}
      {props.audio && (
        <audio
          controls
          src={props.audio}
          autoPlay
          className="mt-5"
          onLoadedMetadata={(e) => props.setAudioDuration(e.currentTarget.duration)}
        />
      )}
    </div>
  );
};

export default GeneratePodcast;
