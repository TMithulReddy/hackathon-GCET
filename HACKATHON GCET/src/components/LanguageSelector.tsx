import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'button' | 'select';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'select', 
  size = 'default',
  className = '' 
}) => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  if (variant === 'button') {
    return (
      <div className={`relative ${className}`}>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-auto">
            <Button variant="ghost" size={size} className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {availableLanguages.find(lang => lang.code === language)?.nativeName || 'EN'}
              </span>
            </Button>
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <span>{lang.nativeName}</span>
                  <span className="text-muted-foreground text-xs">({lang.name})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-32">
          <SelectValue>
            {availableLanguages.find(lang => lang.code === language)?.nativeName || 'English'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span>{lang.nativeName}</span>
                <span className="text-muted-foreground text-xs">({lang.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
