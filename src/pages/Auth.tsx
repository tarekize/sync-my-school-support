import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Eye, EyeOff, User } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import iconStudent from "@/assets/icon-student.png";
import iconParent from "@/assets/icon-parent.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [profileType, setProfileType] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    profileType: false,
    classLevel: false,
    dateOfBirth: false
  });
  const [submitted, setSubmitted] = useState(false);
  
  // RGPD Consent states
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [consentTermsPrivacy, setConsentTermsPrivacy] = useState(false);
  const [consentParental, setConsentParental] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Capturer le code de parrainage depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      // Stocker dans sessionStorage pour le conserver
      sessionStorage.setItem('referralCode', refCode);
    } else {
      // Vérifier si on a un code en sessionStorage
      const storedCode = sessionStorage.getItem('referralCode');
      if (storedCode) {
        setReferralCode(storedCode);
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session) {
          setTimeout(() => {
            navigate("/liste-cours");
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/liste-cours");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marquer le formulaire comme soumis pour afficher les erreurs
    setSubmitted(true);

    // Validation pour l'inscription
    if (!isLogin) {
      if (!firstName || !lastName || !email || !password || !profileType) {
        toast.error("Veuillez remplir tous les champs obligatoires.");
        return;
      }
      
      if (profileType === 'enfant' && !classLevel) {
        toast.error("Veuillez sélectionner votre classe.");
        return;
      }

      // Validation des consentements RGPD
      if (!consentDataProcessing || !consentTermsPrivacy) {
        toast.error("Vous devez accepter le traitement des données et la politique de confidentialité pour vous inscrire.");
        return;
      }

      // Vérification du consentement parental pour les mineurs
      if (dateOfBirth) {
        const age = new Date().getFullYear() - dateOfBirth.getFullYear();
        if (age < 15 && !consentParental) {
          toast.error("Le consentement parental est requis pour les utilisateurs de moins de 15 ans.");
          return;
        }
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Connexion réussie !");
      } else {
        // Préparer les données utilisateur
        const userData: any = {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role: profileType === 'enfant' ? 'student' : 'parent',
        };
        
        // Ajouter la date de naissance si fournie
        if (dateOfBirth) {
          userData.date_of_birth = format(dateOfBirth, 'yyyy-MM-dd');
        }
        
        // N'inclure school_level que pour les élèves
        if (profileType === 'enfant' && classLevel) {
          userData.school_level = classLevel;
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: userData,
          },
        });

        if (error) throw error;

        // Enregistrer les consentements RGPD
        setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const consents = [
              { user_id: session.user.id, consent_type: 'data_processing' },
              { user_id: session.user.id, consent_type: 'terms_and_privacy' }
            ];

            // Ajouter le consentement parental si nécessaire
            if (dateOfBirth) {
              const age = new Date().getFullYear() - dateOfBirth.getFullYear();
              if (age < 15 && consentParental) {
                consents.push({ user_id: session.user.id, consent_type: 'parental_consent' });
              }
            }

            await supabase.from('user_consents').insert(consents);
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement des consentements:', error);
          }
        }, 1500);

        // Si un code de parrainage existe, le stocker dans le profil
        // La relation de parrainage sera créée lors du premier paiement
        if (referralCode) {
          setTimeout(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return;

              // Vérifier que le code est valide
              const { data: referralCodeData } = await supabase
                .from('referral_codes')
                .select('user_id, code')
                .eq('code', referralCode)
                .eq('is_active', true)
                .single();

              if (referralCodeData) {
                // Stocker le code dans le profil pour activation lors du paiement
                await supabase
                  .from('profiles')
                  .update({ pending_referral_code: referralCode })
                  .eq('id', session.user.id);

                // Nettoyer le sessionStorage
                sessionStorage.removeItem('referralCode');
                
                toast.success("Code de parrainage enregistré ! Vous bénéficierez d'une réduction de 5% lors de votre premier paiement d'un abonnement annuel.", {
                  duration: 6000,
                });
              }
            } catch (error) {
              console.error('Erreur lors de l\'enregistrement du code de parrainage:', error);
            }
          }, 2000);
        }

        toast.success("Compte créé avec succès ! Veuillez vérifier votre boîte email et cliquer sur le lien de confirmation pour activer votre compte.", {
          duration: 8000,
        });
      }
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        toast.error("Veuillez d'abord confirmer votre email en cliquant sur le lien envoyé dans votre boîte de réception.", {
          duration: 6000,
        });
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou mot de passe incorrect.");
      } else if (error.message.includes("User already registered")) {
        toast.error("Un compte existe déjà avec cet email.");
      } else {
        toast.error(error.message || "Une erreur s'est produite.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "facebook" | "apple") => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion sociale.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) throw error;
      toast.success("Email de réinitialisation envoyé !");
      setShowForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'email.");
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return null;
  }

  return (
    <>
      <Header minimal={true} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4 pt-24">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl shadow-[var(--shadow-elegant)] p-8 border border-border">
          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-8">
            {showForgotPassword ? "Mot de passe oublié" : isLogin ? "Connecte-toi !" : "Inscription"}
          </h1>

          {showForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/20 border-border"
                  required
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Entrez l'adresse e-mail avec laquelle vous vous êtes inscrit. Nous allons vous envoyer un e-mail avec votre nom d'utilisateur et un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? "Envoi..." : "Réinitialiser le mot de passe"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Retour à la connexion
              </Button>
            </form>
          ) : (
            <>
              {!isLogin && (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {/* Social Login Buttons */}
                  <div className="space-y-3 mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("google")}
                      disabled={loading}
                      className="w-full justify-start"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC04"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#4285F4"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continuer avec Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("facebook")}
                      disabled={loading}
                      className="w-full justify-start"
                    >
                      <svg className="h-5 w-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Continuer avec Facebook
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-card px-3 text-muted-foreground">OU</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Prénom"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setTouched(prev => ({ ...prev, firstName: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                        className={cn(
                          "bg-secondary/20 pl-10",
                          (submitted || touched.firstName) && !firstName ? "border-red-500 border-2" : "border-border"
                        )}
                        required
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Nom"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setTouched(prev => ({ ...prev, lastName: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                        className={cn(
                          "bg-secondary/20 pl-10",
                          (submitted || touched.lastName) && !lastName ? "border-red-500 border-2" : "border-border"
                        )}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Date de naissance</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-secondary/20",
                            !dateOfBirth && "text-muted-foreground",
                            (submitted || touched.dateOfBirth) && !dateOfBirth ? "border-red-500 border-2" : "border-border"
                          )}
                        >
                          {dateOfBirth ? format(dateOfBirth, "dd/MM/yyyy") : "Sélectionnez votre date de naissance"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={(date) => {
                            setDateOfBirth(date);
                            setTouched(prev => ({ ...prev, dateOfBirth: true }));
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Input
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setTouched(prev => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    className={cn(
                      "bg-secondary/20",
                      (submitted || touched.email) && !email ? "border-red-500 border-2" : "border-border"
                    )}
                    required
                  />
                  
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setTouched(prev => ({ ...prev, password: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                      className={cn(
                        "bg-secondary/20 pr-10",
                        (submitted || touched.password) && !password ? "border-red-500 border-2" : "border-border"
                      )}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Qui es-tu ?</Label>
                    <RadioGroup
                      value={profileType} 
                      onValueChange={(value) => {
                        setProfileType(value);
                        setTouched(prev => ({ ...prev, profileType: true }));
                      }} 
                      required
                    >
                      <div className={cn(
                        "grid grid-cols-2 gap-4 p-1 rounded-lg",
                        (submitted || touched.profileType) && !profileType ? "ring-2 ring-red-500" : ""
                      )}>
                        <Label 
                          htmlFor="enfant" 
                          className={cn(
                            "flex flex-col items-center justify-center h-32 px-4 rounded-lg border-2 cursor-pointer transition-all",
                            profileType === "enfant" 
                              ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30"
                          )}
                        >
                          <RadioGroupItem value="enfant" id="enfant" className="sr-only" />
                          <img src={iconStudent} alt="Élève" className="h-20 w-20 mb-2 object-contain" />
                          <span className="font-semibold">Élève</span>
                        </Label>
                        <Label 
                          htmlFor="parent" 
                          className={cn(
                            "flex flex-col items-center justify-center h-32 px-4 rounded-lg border-2 cursor-pointer transition-all",
                            profileType === "parent" 
                              ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30"
                          )}
                        >
                          <RadioGroupItem value="parent" id="parent" className="sr-only" />
                          <img src={iconParent} alt="Parent" className="h-20 w-20 mb-2 object-contain" />
                          <span className="font-semibold">Parent</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {profileType === "enfant" && (
                    <div className="space-y-2">
                      <Label className="text-foreground">En quelle classe es-tu ?</Label>
                      <RadioGroup 
                        value={classLevel} 
                        onValueChange={(value) => {
                          setClassLevel(value);
                          setTouched(prev => ({ ...prev, classLevel: true }));
                        }} 
                        required
                      >
                        <div className={cn(
                          "grid grid-cols-2 gap-3 p-1 rounded-lg",
                          (submitted || touched.classLevel) && !classLevel && profileType === "enfant" ? "ring-2 ring-red-500" : ""
                        )}>
                        <Label
                          htmlFor="6ème" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "6ème" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="6ème" id="6ème" className="sr-only" />
                          6ème
                        </Label>
                        <Label 
                          htmlFor="5ème" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "5ème" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="5ème" id="5ème" className="sr-only" />
                          5ème
                        </Label>
                        <Label 
                          htmlFor="4ème" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "4ème" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="4ème" id="4ème" className="sr-only" />
                          4ème
                        </Label>
                        <Label 
                          htmlFor="3ème" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "3ème" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="3ème" id="3ème" className="sr-only" />
                          3ème
                        </Label>
                        <Label 
                          htmlFor="Seconde" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "Seconde" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="Seconde" id="Seconde" className="sr-only" />
                          Seconde
                        </Label>
                        <Label 
                          htmlFor="1ère" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "1ère" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="1ère" id="1ère" className="sr-only" />
                          1ère
                        </Label>
                        <Label 
                          htmlFor="Terminale" 
                          className={cn(
                            "flex items-center justify-center h-10 px-4 rounded-md border-2 cursor-pointer transition-all font-medium",
                            classLevel === "Terminale" 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "bg-secondary/20 border-border hover:bg-secondary/30 hover:border-primary"
                          )}
                        >
                          <RadioGroupItem value="Terminale" id="Terminale" className="sr-only" />
                          Terminale
                        </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* RGPD Consents */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="consentDataProcessing"
                        checked={consentDataProcessing}
                        onCheckedChange={(checked) => setConsentDataProcessing(checked as boolean)}
                        className="mt-1"
                      />
                      <label
                        htmlFor="consentDataProcessing"
                        className="text-sm text-foreground cursor-pointer leading-relaxed"
                      >
                        <span className="text-red-500">*</span> J'accepte le traitement de mes données personnelles conformément au RGPD
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="consentTermsPrivacy"
                        checked={consentTermsPrivacy}
                        onCheckedChange={(checked) => setConsentTermsPrivacy(checked as boolean)}
                        className="mt-1"
                      />
                      <label
                        htmlFor="consentTermsPrivacy"
                        className="text-sm text-foreground cursor-pointer leading-relaxed"
                      >
                        <span className="text-red-500">*</span> J'accepte les{" "}
                        <a 
                          href="/mentions-legales" 
                          target="_blank" 
                          className="text-primary hover:underline font-medium"
                        >
                          Conditions Générales d'Utilisation
                        </a>
                        {" "}et la{" "}
                        <a 
                          href="/politique-confidentialite" 
                          target="_blank" 
                          className="text-primary hover:underline font-medium"
                        >
                          Politique de Confidentialité
                        </a>
                      </label>
                    </div>

                    {dateOfBirth && new Date().getFullYear() - dateOfBirth.getFullYear() < 15 && (
                      <div className="flex items-start space-x-3 bg-accent/10 p-3 rounded-lg">
                        <Checkbox
                          id="consentParental"
                          checked={consentParental}
                          onCheckedChange={(checked) => setConsentParental(checked as boolean)}
                          className="mt-1"
                        />
                        <label
                          htmlFor="consentParental"
                          className="text-sm text-foreground cursor-pointer leading-relaxed"
                        >
                          <span className="text-red-500">*</span> Je certifie que mes parents/tuteurs légaux consentent à mon inscription et au traitement de mes données personnelles (requis pour les mineurs de moins de 15 ans)
                        </label>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      <span className="text-red-500">*</span> Champs obligatoires. 
                      Pour en savoir plus sur la protection de vos données, consultez notre{" "}
                      <a 
                        href="/politique-confidentialite" 
                        target="_blank" 
                        className="text-primary hover:underline"
                      >
                        Politique de Confidentialité
                      </a>.
                    </p>
                  </div>

                  <Button type="submit" className="w-full bg-primary" disabled={loading}>
                    {loading ? "Chargement..." : "S'inscrire"}
                  </Button>
                </form>
              )}

              {isLogin && (
                <>
                  {/* Social Login Buttons */}
                  <div className="space-y-3 mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("google")}
                      disabled={loading}
                      className="w-full justify-start"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC04"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#4285F4"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Se connecter avec Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("facebook")}
                      disabled={loading}
                      className="w-full justify-start"
                    >
                      <svg className="h-5 w-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Se connecter avec Facebook
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialAuth("apple")}
                      disabled={loading}
                      className="w-full justify-start"
                    >
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Se connecter avec Apple
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-card px-3 text-muted-foreground">OU</span>
                    </div>
                  </div>

                  {/* Email/Password Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Adresse e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary/20 border-border"
                      required
                    />

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-secondary/20 border-border pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <label
                          htmlFor="remember"
                          className="text-sm text-foreground cursor-pointer"
                        >
                          Se souvenir de moi
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>

                    <Button type="submit" className="w-full bg-primary" disabled={loading}>
                      {loading ? "Chargement..." : "Se connecter"}
                    </Button>
                  </form>
                </>
              )}

              {/* Toggle Login/Signup */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-foreground"
                >
                  {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
                  <span className="text-primary hover:underline font-medium">
                    {isLogin ? "Inscris-toi" : "Connecte-toi"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;
