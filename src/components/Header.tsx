
import React from 'react';
import { Calculator, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Calculator className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Yatırım Teşvik Sistemi
            </span>
          </a>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Hizmetler</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                        <Search className="h-6 w-6" />
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Teşvik Sorgulama
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Sektör bazında teşvik oranlarını sorgulayın
                        </p>
                      </div>
                    </li>
                    <li>
                      <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Sektör Sorgusu</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Yüksek teknoloji ve öncelikli sektörler
                        </p>
                      </div>
                    </li>
                    <li>
                      <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Teşvik Hesaplama</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Türkiye Yüzyılı teşvikleri hesaplama
                        </p>
                      </div>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" className="inline-flex items-center gap-2 md:w-40 lg:w-64">
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline-flex">Hızlı arama...</span>
              <span className="inline-flex lg:hidden">Ara...</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
