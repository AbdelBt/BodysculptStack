import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import axios from "axios";

const Admin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
    fetchServices();
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Appel à l'API pour créer un compte
      await axios.post("https://appointment-fr-12d3.onrender.com/user/signup", {
        email,
        password,
      });
      toast({
        description: "A mail verification has been sent to confirm your signup",
        status: "success",
        className: "bg-[#008000]",
      });

      setSuccess("Account created successfully!");
      setEmail(""); // Réinitialise l'email après l'inscription réussie
      setPassword(""); // Réinitialise le mot de passe après l'inscription réussie
    } catch (error) {
      console.error("Error creating account:", error);
      setError("Failed to create account. Please try again.");
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr-12d3.onrender.com/services"
      );
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const addService = async () => {
    if (!newService) {
      toast({
        description: "Service name cannot be empty",
        status: "error",
        className: "bg-[#ff0000]",
      });
      return;
    }

    try {
      await axios.post("https://appointment-fr-12d3.onrender.com/services", {
        name: newService,
      });
      fetchServices();
      setNewService(""); // Réinitialiser l'input après l'ajout
      toast({
        description: "Service added successfully",
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://appointment-fr-12d3.onrender.com/services/${id}`
      );
      setServices(services.filter((service) => service.id !== id));
      console.log(services.filter((service) => service.id !== id));
      toast({
        description: "Service deleted successfully",
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        description: "Failed to delete service",
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  return (
    <div className="admin-page w-full text-white flex lg:flex-row flex-col-reverse mx-5 pt-5">
      <div className="mx-5 mb-5">
        <h1 className="text-4xl font-bold mb-5">Create an account</h1>
        <Card className="mx-auto max-w-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Create your account by entering your email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <br />( should be at least 6 characters)
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create Account
              </Button>
            </form>
          </CardContent>
          <Toaster />
        </Card>
      </div>
      <div className="mx-5 mt-5 sm:mt-0 flex flex-col mb-10">
        <h1 className="text-4xl font-bold mb-5">Services</h1>
        <div className="relative flex flex-col text-white  shadow-md rounded-xl bg-clip-border border border-white">
          <nav className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal text-blue-gray-700">
            {services.length > 0 ? (
              services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center w-full p-3 py-1 pl-4 pr-1 leading-tight transition-all rounded-lg outline-none text-start hover:bg-violet-600 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex w-full items-center">
                      <span className="flex-1">{service.name}</span>
                      <div className="ml-auto">
                        <button
                          className="relative h-10 w-10 max-w-[40px] max-h-[40px] !bg-red-500 rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-blue-gray-500 transition-colors duration-300 ease-in-out hover:!bg-red-700 focus:outline-none"
                          type="button"
                          onClick={() => handleDelete(service.id)}
                        >
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </span>
                        </button>
                      </div>
                    </div>

                    <Separator className="my-2 w-full" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-4  w-full p-3 py-1 pl-4 pr-1 leading-tight transition-all rounded-lg outline-none text-start hover:bg-violet-600 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            )}
          </nav>
        </div>
        <div className="flex w-full  items-center space-x-2 mt-3">
          <Input
            type="text"
            placeholder="add service..."
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
          />
          <Button type="button" className="text-xs" onClick={addService}>
            <Plus />
            ADD
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
