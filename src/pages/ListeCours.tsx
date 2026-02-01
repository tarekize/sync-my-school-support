import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  Search,
  LogOut,
  User as UserIcon,
  BookOpen,
  Beaker,
  Globe,
  Calculator,
  Languages,
  Microscope,
  Landmark,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  school_level: string | null;
  email: string | null;
}

interface Subject {
  id: string;
  name: string;
  icon: any;
  color: string;
  available: boolean;
}

// Static subjects since the database tables don't exist
const staticSubjects: Subject[] = [
  { id: "math", name: "Mathématiques", icon: Calculator, color: "#3B82F6", available: true },
  { id: "physics", name: "Physique-Chimie", icon: Beaker, color: "#8B5CF6", available: false },
  { id: "french", name: "Français", icon: BookOpen, color: "#EF4444", available: false },
  { id: "history", name: "Histoire-Géographie", icon: Globe, color: "#F59E0B", available: false },
  { id: "english", name: "Anglais", icon: Languages, color: "#10B981", available: false },
  { id: "biology", name: "SVT", icon: Microscope, color: "#06B6D4", available: false },
  { id: "philosophy", name: "Philosophie", icon: Landmark, color: "#EC4899", available: false },
];

const ListeCours = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, school_level, email")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (profile: Profile | null): string => {
    if (!profile) return "Utilisateur";
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Utilisateur";
  };

  const getSchoolLevelName = (level: string) => {
    const levels: Record<string, string> = {
      "6eme": "6ème",
      "5eme": "5ème",
      "4eme": "4ème",
      "3eme": "3ème",
      seconde: "Seconde",
      premiere: "Première",
      terminale: "Terminale",
    };
    return levels[level] || level || "Votre classe";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate("/");
  };

  const filteredSubjects = staticSubjects.filter((subject) => 
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fullName = getFullName(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/dashboard")}
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">AcadémiePlus</span>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/10 rounded-lg p-2 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>{fullName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-medium">{fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.school_level && getSchoolLevelName(profile.school_level)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/account")}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Gérer mon compte</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    <span>Tableau de bord</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Matières de {profile?.school_level ? getSchoolLevelName(profile.school_level) : "ta classe"}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Découvre tous les cours de ta classe et prépare-toi à réussir ! 🚀
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher une matière..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-full shadow-lg border-2 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* All Subjects */}
          {filteredSubjects.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Toutes les matières
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredSubjects.map((subject, index) => {
                  const Icon = subject.icon;
                  return (
                    <Card
                      key={subject.id}
                      className={`group transition-all duration-300 hover:shadow-2xl border-2 hover:border-primary/50 animate-fade-in overflow-hidden ${
                        subject.available ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        backgroundColor: `${subject.color}15`,
                      }}
                      onClick={() => subject.available && navigate(`/cours/${subject.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-4">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: subject.color }}
                          >
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{subject.name}</h3>
                            {!subject.available && (
                              <span className="text-xs text-muted-foreground">Bientôt disponible</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* No Results */}
          {filteredSubjects.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">Aucune matière trouvée pour "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListeCours;
