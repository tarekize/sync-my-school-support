import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export default function PreviewCours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      console.log('Loading course with ID:', id);
      const { data, error } = await supabase
        .from('cours')
        .select(`
          *,
          matieres(nom),
          niveaux(nom),
          sections(*, formules(*), medias(*))
        `)
        .eq('id', parseInt(id!))
        .single();

      console.log('Course data:', data);
      console.log('Course error:', error);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Sort sections by ordre
      if (data.sections) {
        console.log('Number of sections:', data.sections.length);
        data.sections.sort((a: any, b: any) => a.ordre - b.ordre);
      } else {
        console.log('No sections found for this course');
      }

      setCourse(data);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      console.log('Loading complete, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const variants: { [key: string]: string } = {
      'brouillon': 'bg-gray-100 text-gray-800 border-gray-300',
      'en_revision': 'bg-orange-100 text-orange-800 border-orange-300',
      'publié': 'bg-green-100 text-green-800 border-green-300',
      'archivé': 'bg-slate-100 text-slate-800 border-slate-300'
    };
    
    return (
      <Badge variant="outline" className={variants[statut] || variants['brouillon']}>
        {statut}
      </Badge>
    );
  };

  const getSectionClass = (type: string) => {
    const classes: { [key: string]: string } = {
      'definition': 'border-l-4 border-blue-500 bg-blue-50/50',
      'propriete': 'border-l-4 border-green-500 bg-green-50/50',
      'exemple': 'border-l-4 border-yellow-500 bg-yellow-50/50',
      'remarque': 'border-l-4 border-gray-400 bg-gray-50/50',
      'methode': 'border-l-4 border-purple-500 bg-purple-50/50'
    };
    return classes[type] || classes['remarque'];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Cours non trouvé</p>
          <Button onClick={() => navigate('/editorial')} className="mt-4">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with status banner */}
      {course.statut !== 'publié' && (
        <div className="bg-orange-100 border-b border-orange-300 py-3 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-orange-800 font-medium">
              PRÉVISUALISATION - Ce contenu n'est pas visible par les élèves
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6">
        {/* Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/editorial/cours/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'éditeur
          </Button>
        </div>

        {/* Course Header */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{course.matieres?.nom}</Badge>
                <Badge variant="secondary">{course.niveaux?.nom}</Badge>
                {getStatusBadge(course.statut)}
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.titre}</h1>
              <p className="text-lg text-muted-foreground mb-4">{course.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.duree_lecture} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Difficulté: {course.difficulte}/5</span>
            </div>
          </div>
        </Card>

        {/* Sections */}
        <div className="space-y-6">
          {course.sections?.map((section: any) => (
            <Card key={section.id} className={`p-6 ${getSectionClass(section.type)}`}>
              <div className="mb-2">
                <Badge variant="outline" className="mb-2 capitalize">
                  {section.type}
                </Badge>
                <h2 className="text-2xl font-semibold mb-4">{section.titre}</h2>
              </div>

              {/* Section content */}
              <div className="prose prose-slate max-w-none mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p style={{ whiteSpace: 'pre-wrap' }} {...props} />
                  }}
                >
                  {section.contenu_texte}
                </ReactMarkdown>
              </div>

              {/* Formulas */}
              {section.formules?.map((formule: any) => (
                <div key={formule.id} className="my-4">
                  {formule.display_mode ? (
                    <div className="text-center py-4">
                      <BlockMath math={formule.latex_source} />
                    </div>
                  ) : (
                    <div className="inline-block">
                      <InlineMath math={formule.latex_source} />
                    </div>
                  )}
                  {formule.legende && (
                    <p className="text-sm text-muted-foreground text-center mt-2 italic">
                      {formule.legende}
                    </p>
                  )}
                </div>
              ))}

              {/* Images */}
              {section.medias?.map((media: any) => (
                <div key={media.id} className="my-6">
                  <img
                    src={media.url}
                    alt={media.alt_text || ''}
                    className="rounded-lg max-w-full h-auto mx-auto"
                  />
                  {media.legende && (
                    <p className="text-sm text-muted-foreground text-center mt-2 italic">
                      {media.legende}
                    </p>
                  )}
                </div>
              ))}
            </Card>
          ))}

          {(!course.sections || course.sections.length === 0) && (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun contenu pour le moment</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
