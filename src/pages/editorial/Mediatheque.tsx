import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Upload, MoreVertical, Eye, Copy, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { ImageUploadModal } from "@/components/editorial/ImageUploadModal";

interface Media {
  id: number;
  type: string;
  url: string;
  nom_fichier: string;
  alt_text?: string;
  legende?: string;
  date_upload: string;
  section_id?: number;
}

export default function Mediatheque() {
  const [medias, setMedias] = useState<Media[]>([]);
  const [filteredMedias, setFilteredMedias] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadMedias();
  }, []);

  useEffect(() => {
    filterMedias();
  }, [searchQuery, typeFilter, medias]);

  const loadMedias = async () => {
    try {
      const { data, error } = await supabase
        .from("medias")
        .select("*")
        .order("date_upload", { ascending: false });

      if (error) throw error;

      setMedias(data || []);
      setFilteredMedias(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des médias");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedias = () => {
    let filtered = medias;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.nom_fichier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.legende?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }

    setFilteredMedias(filtered);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiée dans le presse-papier");
  };

  const deleteMedia = async (id: number) => {
    if (!confirm("Supprimer ce média ?")) return;

    try {
      const { error } = await supabase.from("medias").delete().eq("id", id);

      if (error) throw error;

      toast.success("Média supprimé");
      loadMedias();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleUpload = async (mediaData: any) => {
    try {
      const { error } = await supabase.from("medias").insert([
        {
          type: mediaData.type,
          url: mediaData.url,
          nom_fichier: mediaData.nom_fichier,
          alt_text: mediaData.alt_text,
          legende: mediaData.legende,
          section_id: 1, // Temporary - médias non attachés à une section
        },
      ]);

      if (error) throw error;

      toast.success("Média ajouté à la médiathèque");
      loadMedias();
    } catch (error: any) {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Médiathèque</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos images et médias
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Uploader
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les médias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Vidéos</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Media grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredMedias.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground mb-2">
              Aucun média trouvé
            </p>
            <p className="text-sm text-muted-foreground">
              Uploadez votre premier média pour commencer
            </p>
          </div>
        ) : (
          filteredMedias.map((media) => (
            <Card key={media.id} className="overflow-hidden group">
              <div className="aspect-square relative bg-muted">
                {media.type === "image" && media.url ? (
                  <img
                    src={media.url}
                    alt={media.alt_text || media.nom_fichier}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(media.url, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyUrl(media.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium truncate flex-1">
                    {media.nom_fichier}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(media.url, "_blank")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Aperçu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyUrl(media.url)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteMedia(media.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {media.alt_text && (
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                    {media.alt_text}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {media.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(media.date_upload).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ImageUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
