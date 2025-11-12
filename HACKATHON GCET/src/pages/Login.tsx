import { useState } from 'react';
import { motion } from 'framer-motion';
import { Waves, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '@/contexts/AuthContext';

const Login = () => {
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('fisherman');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Get the intended role from navigation state or URL
  const intendedRole = (location.state as any)?.role || role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password, role);
    if (success) {
      // Navigate to appropriate dashboard
      if (role === 'fisherman') {
        navigate('/fisherman');
      } else {
        navigate('/authority');
      }
    } else {
      setError(t('login.error'));
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setRole(demoRole);
    setEmail(demoRole === 'fisherman' ? 'fisherman@tidewise.com' : 'authority@tidewise.com');
    setPassword(demoRole === 'fisherman' ? 'fisherman123' : 'authority123');
    
    const success = await login(
      demoRole === 'fisherman' ? 'fisherman@tidewise.com' : 'authority@tidewise.com',
      demoRole === 'fisherman' ? 'fisherman123' : 'authority123',
      demoRole
    );
    
    if (success) {
      navigate(demoRole === 'fisherman' ? '/fisherman' : '/authority');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-ocean border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-ocean flex items-center justify-center shadow-ocean">
                <Waves className="h-9 w-9 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              {t('app.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t('login.title')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t('login.role')}</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('login.role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisherman">{t('role.fisherman')}</SelectItem>
                    <SelectItem value="authority">{t('role.authority')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@tidewise.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-ocean hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? t('login.loading') : t('login.submit')}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('login.demo')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('fisherman')}
                disabled={isLoading}
                className="text-xs"
              >
                {t('role.fisherman')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('authority')}
                disabled={isLoading}
                className="text-xs"
              >
                {t('role.authority')}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>{t('login.fisherman')}</strong></p>
              <p><strong>{t('login.authority')}</strong></p>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← {t('common.back')} {t('nav.dashboard')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
