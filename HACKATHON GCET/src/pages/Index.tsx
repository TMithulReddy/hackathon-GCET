import { motion } from 'framer-motion';
import { Waves, Shield, Navigation, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: Navigation, title: t('feature.navigation'), description: t('feature.navigation.desc') },
    { icon: Phone, title: t('feature.sos'), description: t('feature.sos.desc') },
    { icon: Waves, title: t('feature.forecasts'), description: t('feature.forecasts.desc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="button" size="sm" />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-ocean flex items-center justify-center shadow-ocean">
              <Waves className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
            {t('app.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('app.subtitle')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-ocean transition-all duration-300 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Role Selection */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-8">{t('role.select')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fisherman Card */}
            <Card className="shadow-card hover:shadow-ocean transition-all duration-300 cursor-pointer group">
              <CardContent className="p-8">
                <div className="h-20 w-20 rounded-2xl bg-gradient-ocean flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Navigation className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-3">{t('role.fisherman')}</h3>
                <p className="text-center text-muted-foreground mb-6">
                  {t('role.fisherman.desc')}
                </p>
                <Button 
                  onClick={() => navigate('/login', { state: { role: 'fisherman' } })}
                  className="w-full bg-gradient-ocean hover:opacity-90"
                  size="lg"
                >
                  {t('common.access')}
                </Button>
              </CardContent>
            </Card>

            {/* Authority Card */}
            <Card className="shadow-card hover:shadow-ocean transition-all duration-300 cursor-pointer group">
              <CardContent className="p-8">
                <div className="h-20 w-20 rounded-2xl bg-gradient-ocean flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-center mb-3">{t('role.authority')}</h3>
                <p className="text-center text-muted-foreground mb-6">
                  {t('role.authority.desc')}
                </p>
                <Button 
                  onClick={() => navigate('/login', { state: { role: 'authority' } })}
                  className="w-full bg-gradient-ocean hover:opacity-90"
                  size="lg"
                >
                  {t('common.access')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 text-sm text-muted-foreground"
        >
          <p>{t('app.footer')}</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
