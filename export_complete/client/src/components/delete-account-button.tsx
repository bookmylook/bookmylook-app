import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountButtonProps {
  variant?: "destructive" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export default function DeleteAccountButton({ 
  variant = "destructive", 
  size = "default", 
  className = "",
  children 
}: DeleteAccountButtonProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Account deleted successfully:', data);
      
      // Clear all query cache
      queryClient.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      // Show success message
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
        variant: "destructive"
      });
      
      // Redirect to home page
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    },
    onError: (error: Error) => {
      console.error('Account deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsDeletingAccount(false);
      setIsOpen(false);
      setConfirmText("");
    }
  });

  const handleDeleteAccount = () => {
    if (confirmText.toLowerCase() !== "delete my account") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'delete my account' exactly as shown.",
        variant: "destructive"
      });
      return;
    }

    setIsDeletingAccount(true);
    deleteAccountMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          data-testid="button-delete-account"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {children || "Delete Account"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete Account Permanently
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            ⚠️ This action cannot be undone! This will permanently delete all your data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-3">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              To confirm deletion, type: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-600">delete my account</span>
            </Label>
            <div className="space-y-2">
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type confirmation text here"
                className="w-full text-lg p-3 font-mono"
                data-testid="input-confirm-delete"
                autoComplete="off"
                spellCheck="false"
              />
              <div className="bg-gray-50 border rounded p-3 space-y-2">
                <p className="text-sm text-gray-600 font-medium">What you've typed:</p>
                <div className="bg-white border rounded p-2 min-h-[32px] overflow-x-auto">
                  <p className="font-mono text-base break-all">
                    {confirmText || <span className="text-gray-400 italic">nothing typed yet</span>}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${confirmText === "delete my account" ? "text-green-600" : "text-red-600"}`}>
                    {confirmText === "delete my account" ? "✓ Correct! You can now delete." : "✗ Must match exactly: delete my account"}
                  </span>
                  <span className="text-gray-500">
                    {confirmText.length}/17 characters
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsOpen(false);
              setConfirmText("");
            }}
            disabled={isDeletingAccount}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount || confirmText.toLowerCase() !== "delete my account"}
            data-testid="button-confirm-delete"
          >
            {isDeletingAccount ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}