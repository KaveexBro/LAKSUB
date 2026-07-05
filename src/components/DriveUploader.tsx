import React, { useState, useRef } from 'react';
import { Upload, Terminal, FileText, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface DriveUploaderProps {
  onUploadSuccess?: (downloadLink: string) => void;
}

export const DriveUploader: React.FC<DriveUploaderProps> = ({ onUploadSuccess }) => {
  const [mediaType, setMediaType] = useState<'movie' | 'series'>('movie');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [syncVersion, setSyncVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.srt') && !selectedFile.name.endsWith('.zip')) {
        setStatus('error');
        setMessage('ERR: INVALID_FILE_TYPE. ONLY .srt OR .zip ALLOWED.');
        return;
      }
      setFile(selectedFile);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setStatus('error');
      setMessage('ERR: NO_FILE_SELECTED');
      return;
    }

    if (!title || !syncVersion || (mediaType === 'movie' && !year) || (mediaType === 'series' && (!season || !episode))) {
      setStatus('error');
      setMessage('ERR: MISSING_METADATA');
      return;
    }

    setStatus('uploading');
    setMessage('INITIATING UPLOAD SEQUENCE...');

    try {
      // Read file as base64 to easily send via JSON
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // Construct filename based on metadata
        let fileName = '';
        if (mediaType === 'movie') {
          fileName = `${title.replace(/\s+/g, '.')}.${year}.${syncVersion}.Sinhala.Sub.srt`;
        } else {
          const s = season.padStart(2, '0');
          const ep = episode.padStart(2, '0');
          fileName = `${title.replace(/\s+/g, '.')}.S${s}E${ep}.${syncVersion}.Sinhala.Sub.srt`;
        }

        const payload = {
          fileName,
          mimeType: file.type || 'application/x-subrip',
          fileData: base64Data,
          metadata: {
            mediaType,
            title,
            year,
            season,
            episode,
            syncVersion
          }
        };

        setMessage('TRANSMITTING DATA TO SECURE SERVER...');

        const response = await fetch('/api/upload-drive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        let data;
        const text = await response.text();
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('Failed to parse response:', text);
          throw new Error(`Server returned invalid response. Status: ${response.status}`);
        }

        if (!response.ok) {
          throw new Error(data.error || `UPLOAD_FAILED (${response.status})`);
        }

        setStatus('success');
        setMessage('UPLOAD COMPLETE. LINK GENERATED.');
        setDownloadLink(data.downloadLink);
        
        if (onUploadSuccess) {
          onUploadSuccess(data.downloadLink);
        }
        
        // Reset form
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      
      reader.onerror = () => {
        throw new Error('FILE_READ_ERROR');
      };

    } catch (err: any) {
      setStatus('error');
      setMessage(`ERR: ${err.message.toUpperCase()}`);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-green-500/30 rounded-lg p-6 font-mono text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)] max-w-2xl mx-auto relative overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20"></div>
      
      <div className="flex items-center gap-3 mb-6 border-b border-green-500/30 pb-4 relative z-10">
        <Terminal className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bold tracking-widest text-green-400">G-DRIVE UPLINK TERMINAL</h2>
        <div className="ml-auto flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80 animate-pulse"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs text-green-600 uppercase tracking-wider">&gt; MEDIA_TYPE</label>
            <select 
              value={mediaType} 
              onChange={(e) => setMediaType(e.target.value as 'movie' | 'series')}
              className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none appearance-none"
            >
              <option value="movie">MOVIE</option>
              <option value="series">SERIES</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-green-600 uppercase tracking-wider">&gt; TITLE</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Inception"
              className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-800 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
            />
          </div>

          {mediaType === 'movie' ? (
            <div className="space-y-1">
              <label className="text-xs text-green-600 uppercase tracking-wider">&gt; RELEASE_YEAR</label>
              <input 
                type="number" 
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2010"
                className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-800 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
              />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs text-green-600 uppercase tracking-wider">&gt; SEASON</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-800 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-green-600 uppercase tracking-wider">&gt; EPISODE</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-800 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-green-600 uppercase tracking-wider">&gt; SYNC_VERSION</label>
            <input 
              type="text" 
              required
              value={syncVersion}
              onChange={(e) => setSyncVersion(e.target.value)}
              placeholder="e.g. WEB-DL.1080p"
              className="w-full bg-black/50 border border-green-500/30 rounded px-3 py-2 text-green-400 placeholder-green-800 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-green-500/30">
          <label className="text-xs text-green-600 uppercase tracking-wider block mb-2">&gt; SELECT_PAYLOAD (.SRT)</label>
          <div 
            className={`border-2 border-dashed ${file ? 'border-green-500 bg-green-500/10' : 'border-green-800 hover:border-green-500/50'} rounded-lg p-6 text-center cursor-pointer transition-colors`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".srt,.zip"
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-green-400" />
                <span className="text-green-400 font-bold">{file.name}</span>
                <span className="text-green-600 text-xs">{(file.size / 1024).toFixed(2)} KB READY FOR TRANSMISSION</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-green-700">
                <Upload className="w-8 h-8" />
                <span>CLICK TO INITIALIZE UPLOAD</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Display */}
        {status !== 'idle' && (
          <div className={`p-3 rounded border ${
            status === 'error' ? 'bg-red-950/50 border-red-500/50 text-red-400' : 
            status === 'success' ? 'bg-green-950/50 border-green-500/50 text-green-400' : 
            'bg-blue-950/50 border-blue-500/50 text-blue-400'
          } flex items-start gap-3`}>
            {status === 'error' && <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
            {status === 'success' && <Check className="w-5 h-5 shrink-0 mt-0.5" />}
            {status === 'uploading' && <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />}
            <div className="break-all">
              <p className="font-bold">{message}</p>
              {status === 'success' && downloadLink && (
                <div className="mt-2 text-xs">
                  <span className="text-green-600">LINK: </span>
                  <a href={downloadLink} target="_blank" rel="noreferrer" className="underline hover:text-green-300">
                    {downloadLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={status === 'uploading'}
          className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 py-3 rounded font-bold tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {status === 'uploading' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> EXECUTING...</>
          ) : (
            <><Terminal className="w-5 h-5" /> EXECUTE UPLOAD</>
          )}
        </button>
      </form>
    </div>
  );
};

export default DriveUploader;
