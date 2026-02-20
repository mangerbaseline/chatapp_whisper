import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import DobPicker from "./DobPicker";
import { Textarea } from "./ui/textarea";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  updateUser,
  updateProfileImage,
  setUser,
} from "@/redux/features/auth/authSlice";
import { useRef } from "react";
import { toast } from "sonner";
import { updateSchema } from "@/verification/auth.verification";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function Profile() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const user = useSelector((state: RootState) => state.auth.user);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    dateOfBirth: undefined as Date | undefined,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        address: user.address ?? "",
        email: user.email ?? "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      ...formData,
      dateOfBirth: formData.dateOfBirth
        ? formData.dateOfBirth.toISOString()
        : "",
    };

    const result = updateSchema.safeParse(payload);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    try {
      const res = await dispatch(updateUser(payload)).unwrap();
      dispatch(setUser({ ...user, ...res.data }));
      toast.success("User updated successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Update failed.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await dispatch(updateProfileImage(formData)).unwrap();
      toast.success("Profile image updated successfully");
      setSelectedFile(null);
      setPreviewImage(null);
    } catch (err: any) {
      toast.error(err?.message || "Image upload failed");
    }
  };

  return (
    <Card className="border-border/50 bg-card opacity-0 animate-fade-in">
      <CardHeader>
        <CardTitle className="text-foreground">Profile Information</CardTitle>
        <CardDescription className="text-muted-foreground">
          Update your personal details and profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors">
              <AvatarImage
                src={previewImage || user?.image || "/man.png"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.firstName?.[0]}
                {user?.lastName?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-110 shadow-lg cursor-pointer"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleImageUpload}
                  disabled={isLoading}
                  className="h-8 px-3"
                >
                  {isLoading ? "Uploading..." : "Save Photo"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewImage(null);
                  }}
                  disabled={isLoading}
                  className="h-8 px-3"
                >
                  Cancel
                </Button>
              </div>
            )}
            {!selectedFile && (
              <Badge className="bg-primary/20 text-primary border-none">
                {user?.role}
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-border" />

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
              {errors.firstName && (
                <p className="text-destructive text-xs mt-1">
                  {errors.firstName[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
              {errors.lastName && (
                <p className="text-destructive text-xs mt-1">
                  {errors.lastName[0]}
                </p>
              )}
            </div>
            <div className="space-y-2 mt-3">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-muted/50 border-border"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">
                  {errors.email[0]}
                </p>
              )}
            </div>
            <DobPicker
              className="bg-muted/50 border-border"
              value={formData.dateOfBirth}
              onChange={(date) =>
                setFormData({ ...formData, dateOfBirth: date })
              }
            />
          </div>
          <div className="space-y-2 mt-3">
            <Label htmlFor="address" className="text-foreground">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="bg-muted/50 border-border"
            />
            {errors.address && (
              <p className="text-destructive text-xs mt-1">
                {errors.address[0]}
              </p>
            )}
          </div>

          <div className="flex justify-end mt-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
