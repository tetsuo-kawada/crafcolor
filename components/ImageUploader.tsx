
import React, { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageUpload(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="my-[clamp(0.75rem,3vw,1rem)]">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        aria-label={t('uploadButton')}
      />
      <button
        onClick={handleClick}
        className="px-[clamp(1.5rem,5vw,2.5rem)] py-[clamp(0.6rem,2.5vw,0.875rem)] bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out text-[clamp(0.875rem,2.5vw,1.125rem)]"
      >
        {t('uploadButton')}
      </button>
    </div>
  );
};

export default ImageUploader;
