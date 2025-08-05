"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import NavigationAvatarItem from "./navigation_avatar";

export default function NavigationBar() {
  return (
    <div className="flex items-center w-screen fixed top-0 left-0 justify-start pl-4 h-20 bg-slate-50">
      <div className="">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem className=" font-bold text-gray-700 transition-all pr-4">
              Remote Desktop
            </NavigationMenuItem>
            <NavigationMenuItem className="hover:text-blue-400 transition-all pr-4">
              <NavigationMenuLink href="/dashboard">
                Dashboard
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      {/* <div className="ml-auto relative max-w-sm">
      <Search className="absolute left-3 top-2 h-4 w-4 transform text-muted-foreground" />
      <Input type="search" placeholder="Search..." className="w-full rounded-full bg-muted pl-10 pr-4" />
    </div> */}
      <NavigationAvatarItem />
    </div>
  );
}
