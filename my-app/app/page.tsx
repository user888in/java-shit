"use client";

import LoginForm from "@/components/LoginForm";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Settings, UserCircle, X } from "lucide-react";
import React, { useState } from "react";

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-2 bg-black/80 text-white rounded"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isOpen && (
        <ul className="absolute right-0 mt-3 w-52 rounded-xl bg-white p-2 shadow-lg">
          <li className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-black/80 hover:text-white">
            <UserCircle size={18} />
            Profile
          </li>

          <li className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-black/80 hover:text-white">
            <Settings size={18} />
            Settings
          </li>

          <div className="my-1 h-px bg-zinc-100" />

          <li className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50">
            <LogOut size={18} />
            Logout
          </li>
        </ul>
      )}
    </div>
  );
}

const HomePage = () => {
  const [cart, setCart] = useState<string[]>([]);
  const handleAddToCart = (name: string) => {
    setCart((prev) => [...prev, name]);
  };
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4">
      <div className="flex justify-between">
        <h1>Logo</h1>
        <Dropdown />
      </div>
      <div className="p-8 grid grid-cols-3 gap-4">
       <ProductCard />
      </div>
      {/* buttons  */}
      <Button variant="default">Default</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
      <div className="py-5">
        <LoginForm />
      </div>
    </div>
  );
};

export default HomePage;
