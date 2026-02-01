import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onSuccess: () => void;
}

export function ReviewModal({ open, onClose, courseId, onSuccess }: ReviewModalProps) {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadReviewers();
    }
  }, [open]);

  const loadReviewers = async () => {
    try {
      // Get all users with 'reviseur' or 'admin' role
      const { data: reviewerRoles, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles (
            id,
            email,
            full_name
          )
        `)
        .in('role', ['reviseur' as any, 'admin' as any]);

      if (error) throw error;

      // Filter unique users
      const uniqueReviewers = reviewerRoles
        ?.filter((r: any) => r.profiles)
        .reduce((acc: any[], curr: any) => {
          if (!acc.find((r: any) => r.id === curr.profiles.id)) {
            acc.push(curr.profiles);
          }
          return acc;
        }, []);

      setReviewers(uniqueReviewers || []);
    } catch (error) {
      console.error('Error loading reviewers:', error);
      toast.error("Erreur lors du chargement des réviseurs");
    }
  };

  const handleSendToReview = async () => {
    if (!selectedReviewer) {
      toast.error("Veuillez sélectionner un réviseur");
      return;
    }

    setLoading(true);
    try {
      // Update course status
      const { error: updateError } = await supabase
        .from('cours')
        .update({ 
          statut: 'en_revision',
          revieur_id: selectedReviewer || null, // UUID string
          commentaire_revue: message || null,
          date_modification: new Date().toISOString()
        })
        .eq('id', parseInt(courseId));

      if (updateError) throw updateError;

      // TODO: Send email notification if sendEmail is true
      // This would require an edge function

      toast.success("Cours envoyé en révision");
      onSuccess();
      onClose();
      
      // Reset form
      setSelectedReviewer("");
      setMessage("");
      setSendEmail(true);
    } catch (error) {
      console.error('Error sending to review:', error);
      toast.error("Erreur lors de l'envoi en révision");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer en révision</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer">Sélectionner un réviseur *</Label>
            <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
              <SelectTrigger id="reviewer">
                <SelectValue placeholder="Choisir un réviseur..." />
              </SelectTrigger>
              <SelectContent>
                {reviewers.map((reviewer) => (
                  <SelectItem key={reviewer.id} value={reviewer.id}>
                    {reviewer.full_name || reviewer.email}
                  </SelectItem>
                ))}
                {reviewers.length === 0 && (
                  <SelectItem value="none" disabled>
                    Aucun réviseur disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="email" 
              checked={sendEmail} 
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label 
              htmlFor="email" 
              className="text-sm font-normal cursor-pointer"
            >
              Notifier par email
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message/Notes pour le réviseur</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Veuillez vérifier la conformité avec le nouveau programme 2025-2026..."
              className="min-h-[100px]"
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            Le cours sera visible aux réviseurs et marqué comme "en révision"
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSendToReview} disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer en révision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
