import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Eye, Trash2, AlertTriangle, FileText, Shield } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const MesDonneesPersonnelles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [consents, setConsents] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [deletionRequest, setDeletionRequest] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // Load consents
      const { data: consentsData } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('accepted_at', { ascending: false });
      
      setConsents(consentsData || []);

      // Load recent access logs
      const { data: logsData } = await supabase
        .from('data_access_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setAccessLogs(logsData || []);

      // Check for pending deletion request
      const { data: deletionData } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('executed', false)
        .single();
      
      setDeletionRequest(deletionData);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('export-user-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      // Create a blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edusuccess-mes-donnees-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Vos données ont été exportées avec succès !");
      
      // Reload to update access logs
      setTimeout(loadUserData, 1000);

    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || "Erreur lors de l'export des données");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          reason: 'User requested account deletion'
        });

      if (error) throw error;

      toast.success(
        "Demande de suppression enregistrée. Votre compte sera supprimé dans 30 jours. Vous pouvez annuler cette demande à tout moment pendant cette période.",
        { duration: 8000 }
      );

      loadUserData();

    } catch (error: any) {
      console.error('Deletion request error:', error);
      toast.error(error.message || "Erreur lors de la demande de suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!deletionRequest) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('account_deletion_requests')
        .update({ 
          cancelled: true, 
          cancelled_at: new Date().toISOString() 
        })
        .eq('id', deletionRequest.id);

      if (error) throw error;

      toast.success("Demande de suppression annulée avec succès !");
      setDeletionRequest(null);

    } catch (error: any) {
      console.error('Cancel deletion error:', error);
      toast.error(error.message || "Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  const getConsentLabel = (type: string) => {
    switch (type) {
      case 'data_processing':
        return 'Traitement des données personnelles';
      case 'terms_and_privacy':
        return 'Conditions générales et politique de confidentialité';
      case 'parental_consent':
        return 'Consentement parental (mineur)';
      default:
        return type;
    }
  };

  const getAccessTypeLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'Consultation';
      case 'export':
        return 'Export';
      case 'modify':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-background via-secondary/10 to-background py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Mes Données Personnelles
            </h1>
            <p className="text-muted-foreground">
              Gérez vos données conformément au RGPD - Vos droits : accès, rectification, portabilité, oubli
            </p>
          </div>

          {deletionRequest && !deletionRequest.cancelled && (
            <Card className="mb-8 border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">Suppression de compte en attente</CardTitle>
                </div>
                <CardDescription>
                  Votre compte sera supprimé le {new Date(deletionRequest.scheduled_deletion_at).toLocaleDateString('fr-FR')}. 
                  Vous pouvez annuler cette demande à tout moment avant cette date.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCancelDeletion} 
                  variant="outline"
                  disabled={loading}
                >
                  Annuler la suppression
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Mes Informations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Mes Informations
                </CardTitle>
                <CardDescription>
                  Consultez et modifiez vos données personnelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Nom complet:</span> {profile.full_name || 'Non renseigné'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {profile.email}
                    </div>
                    <div>
                      <span className="font-medium">Rôle:</span> {profile.role}
                    </div>
                    <div>
                      <span className="font-medium">Niveau:</span> {profile.school_level || 'Non renseigné'}
                    </div>
                    <div>
                      <span className="font-medium">Compte actif:</span>{' '}
                      <Badge variant={profile.account_active ? "default" : "destructive"}>
                        {profile.account_active ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>
                )}
                <Separator />
                <Button 
                  onClick={() => navigate('/mes-informations')} 
                  variant="outline"
                  className="w-full"
                >
                  Modifier mes informations
                </Button>
              </CardContent>
            </Card>

            {/* Export de données */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exporter mes données
                </CardTitle>
                <CardDescription>
                  Téléchargez toutes vos données au format JSON (droit à la portabilité)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vous recevrez un fichier JSON contenant :
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Vos informations de profil</li>
                  <li>Vos abonnements et paiements</li>
                  <li>Vos factures</li>
                  <li>Vos résultats d'examens</li>
                  <li>Vos parrainages</li>
                  <li>Vos consentements</li>
                </ul>
                <Button 
                  onClick={handleExportData} 
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Export en cours...' : 'Exporter mes données'}
                </Button>
              </CardContent>
            </Card>

            {/* Mes Consentements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Mes Consentements
                </CardTitle>
                <CardDescription>
                  Historique de vos consentements RGPD
                </CardDescription>
              </CardHeader>
              <CardContent>
                {consents.length > 0 ? (
                  <div className="space-y-3">
                    {consents.map((consent) => (
                      <div key={consent.id} className="text-sm border-b pb-2">
                        <div className="font-medium">{getConsentLabel(consent.consent_type)}</div>
                        <div className="text-muted-foreground text-xs">
                          Accepté le {new Date(consent.accepted_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun consentement enregistré</p>
                )}
              </CardContent>
            </Card>

            {/* Historique d'accès */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Historique d'accès
                </CardTitle>
                <CardDescription>
                  Derniers accès à vos données personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accessLogs.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {accessLogs.map((log) => (
                      <div key={log.id} className="text-sm border-b pb-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{getAccessTypeLabel(log.access_type)}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.data_type}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun accès enregistré</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Supprimer mon compte */}
          <Card className="mt-6 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Supprimer mon compte
              </CardTitle>
              <CardDescription>
                Action irréversible - Période de grâce de 30 jours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">⚠️ Avant de supprimer votre compte :</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Toutes vos données personnelles seront supprimées</li>
                  <li>Vos abonnements seront annulés</li>
                  <li>Vous disposerez d'une période de grâce de 30 jours pour annuler</li>
                  <li>Les factures seront conservées 10 ans (obligation légale)</li>
                  <li>Cette action est définitive après 30 jours</li>
                </ul>
              </div>

              {!deletionRequest && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={loading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action planifiera la suppression de votre compte dans 30 jours.
                        Vous recevrez un email de confirmation et pourrez annuler à tout moment pendant cette période.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRequestDeletion} className="bg-destructive hover:bg-destructive/90">
                        Confirmer la suppression
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Liens utiles */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/politique-confidentialite')}>
              Politique de confidentialité
            </Button>
            <Button variant="outline" onClick={() => navigate('/mentions-legales')}>
              Mentions légales
            </Button>
            <Button variant="outline" onClick={() => window.open('https://www.cnil.fr', '_blank')}>
              Site de la CNIL
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MesDonneesPersonnelles;
