import { CreateUserForm } from "@/components/CreateUserForm";

export default function CreateUserPage() {
  return (
    <div className=" flex  flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <CreateUserForm />
      </div>
    </div>
  );
}
