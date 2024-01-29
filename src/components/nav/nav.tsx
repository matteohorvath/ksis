import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fontSans } from "@/pages/_app";
export default function Nav({ className }: { className?: string }) {
  return (
    <div
      className={`${className} px-10 px-10 py-10 sm:px-20 md:visible md:px-40 `}
    >
      <NavigationMenu>
        <div className="mr-10 text-2xl font-bold">KSIS</div>
        <NavContent className="hidden md:flex" />
        <NavigationMenuList className=" md:hidden">
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              <Sheet>
                <SheetTrigger>Open</SheetTrigger>
                <SheetContent side={"left"} className={fontSans.className}>
                  <SheetHeader>
                    <SheetTitle>KSIS</SheetTitle>
                    <SheetDescription>
                      <NavContent className="block " />
                    </SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function NavContent({ className }: { className?: string }) {
  return (
    <NavigationMenuList className={`${className}`}>
      <NavigationMenuItem>
        <Link href="/" legacyBehavior passHref>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <div className="text-xl">Következő versenyek</div>
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link href="/old" legacyBehavior passHref>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <div className="text-xl">Régi versenyek</div>
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}
