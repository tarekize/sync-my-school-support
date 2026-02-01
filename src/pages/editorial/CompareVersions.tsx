import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";

interface Version {
  id: number;
  version_numero: number;
  commentaire: string;
  date_version: string;
  contenu_snapshot: any;
}

export default function CompareVersions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const v1 = searchParams.get('v1');
  const v2 = searchParams.get('v2');
  
  const [version1, setVersion1] = useState<Version | null>(null);
  const [version2, setVersion2] = useState<Version | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (v1 && v2) {
      loadVersions();
    }
  }, [id, v1, v2]);

  const loadVersions = async () => {
    try {
      // Load course title
      const { data: course } = await supabase
        .from('cours')
        .select('titre')
        .eq('id', parseInt(id!))
        .single();

      if (course) setCourseTitle(course.titre);

      // Load both versions
      const { data: versions, error } = await supabase
        .from('historique_versions')
        .select('*')
        .eq('cours_id', parseInt(id!))
        .in('version_numero', [parseInt(v1!), parseInt(v2!)])
        .order('version_numero');

      if (error) throw error;

      if (versions && versions.length === 2) {
        setVersion1(versions[0]);
        setVersion2(versions[1]);
      } else {
        toast.error("Versions non trouvées");
        navigate(`/editorial/cours/${id}/historique`);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const getDifferences = () => {
    if (!version1 || !version2) return { added: [], removed: [], modified: [] };

    const snapshot1 = version1.contenu_snapshot || {};
    const snapshot2 = version2.contenu_snapshot || {};

    const added = [];
    const removed = [];
    const modified = [];

    // Compare titles
    if (snapshot1.titre !== snapshot2.titre) {
      modified.push({
        field: 'Titre',
        old: snapshot1.titre,
        new: snapshot2.titre
      });
    }

    // Compare descriptions
    if (snapshot1.description !== snapshot2.description) {
      modified.push({
        field: 'Description',
        old: snapshot1.description,
        new: snapshot2.description
      });
    }

    // Compare sections
    const sections1 = snapshot1.sections || [];
    const sections2 = snapshot2.sections || [];

    // Find added sections
    sections2.forEach((s2: any) => {
      if (!sections1.find((s1: any) => s1.id === s2.id)) {
        added.push({ type: 'Section', title: s2.titre });
      }
    });

    // Find removed sections
    sections1.forEach((s1: any) => {
      if (!sections2.find((s2: any) => s2.id === s1.id)) {
        removed.push({ type: 'Section', title: s1.titre });
      }
    });

    // Find modified sections
    sections1.forEach((s1: any) => {
      const s2 = sections2.find((s: any) => s.id === s1.id);
      if (s2 && s1.contenu_texte !== s2.contenu_texte) {
        modified.push({
          field: `Section "${s1.titre}"`,
          old: s1.contenu_texte,
          new: s2.contenu_texte
        });
      }
    });

    return { added, removed, modified };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!version1 || !version2) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Versions non trouvées</p>
          <Button onClick={() => navigate(`/editorial/cours/${id}/historique`)} className="mt-4">
            Retour à l'historique
          </Button>
        </div>
      </div>
    );
  }

  const differences = getDifferences();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/editorial/cours/${id}/historique`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'historique
          </Button>
          <h1 className="text-3xl font-bold mt-4">Comparaison de versions</h1>
          <p className="text-muted-foreground mt-1">{courseTitle}</p>
        </div>

        {/* Version headers */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-4 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-red-600">Version {version1.version_numero}</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(version1.date_version).toLocaleDateString('fr-FR')}
                </p>
                {version1.commentaire && (
                  <p className="text-sm mt-1">{version1.commentaire}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-green-600">Version {version2.version_numero}</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(version2.date_version).toLocaleDateString('fr-FR')}
                </p>
                {version2.commentaire && (
                  <p className="text-sm mt-1">{version2.commentaire}</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Differences summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Résumé des modifications</h2>
          <div className="space-y-4">
            {differences.added.length > 0 && (
              <div>
                <h3 className="font-medium text-green-700 mb-2">Ajouts ({differences.added.length})</h3>
                <ul className="list-disc list-inside space-y-1">
                  {differences.added.map((item, index) => (
                    <li key={index} className="text-green-600">
                      {item.type}: {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {differences.removed.length > 0 && (
              <div>
                <h3 className="font-medium text-red-700 mb-2">Suppressions ({differences.removed.length})</h3>
                <ul className="list-disc list-inside space-y-1">
                  {differences.removed.map((item, index) => (
                    <li key={index} className="text-red-600">
                      {item.type}: {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {differences.modified.length > 0 && (
              <div>
                <h3 className="font-medium text-orange-700 mb-2">Modifications ({differences.modified.length})</h3>
                <div className="space-y-4">
                  {differences.modified.map((item, index) => (
                    <Card key={index} className="p-4">
                      <h4 className="font-medium mb-2">{item.field}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Avant</p>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{item.old || 'Vide'}</ReactMarkdown>
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Après</p>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{item.new || 'Vide'}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {differences.added.length === 0 && 
             differences.removed.length === 0 && 
             differences.modified.length === 0 && (
              <p className="text-muted-foreground">Aucune différence détectée</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
