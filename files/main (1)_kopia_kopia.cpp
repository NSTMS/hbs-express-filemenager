#include<iostream>
#include<windows.h>
#include<string>
#include<map>
#include<vector>
#include<fstream>
#include <time.h>
#include <locale.h>
#include<cstdlib>
#include<cmath>



// codepage:πÊÍ≥ÒÛúøü•∆ £—”åØè

using namespace std;

int main()
{
// POSLKIE znaki w konsoli (po dodaniu biblioteki <windows.h>)
    system("chcp 65001");
    system("cls");

    string linia,id,country, name,lat,lng,miasto;
    fstream city;

    vector<string> line;
    vector<string> nazwa_miasta;
    vector<string> dlugosc_geo;
    vector<string> szerokosc_geo;
    map<string,string> Dlugosc;
    map<string,string> Szerokosc;


    int promien;
    double wynik;
    city.open("miasta.txt", ios::in | ios::out );


    cout<<"Lista miast"<<endl;

    while(!city.eof())
    {

        city >> id >> country >> name >> lat >> lng;

        nazwa_miasta.push_back(name);
        dlugosc_geo.push_back(lat);
        szerokosc_geo.push_back(lng);
        line.push_back(linia);

        Dlugosc[name] = lat;
        Szerokosc[name] = lng;

        getline(city,linia);
        cout<<name<<endl;

    }
err1:
    cout<<"Podaj miasto z listy: ";
    cin>>miasto;

    for(unsigned int i = 0; i<=nazwa_miasta.size(); i++)
    {
        if(nazwa_miasta[i] == miasto)
        {
            cout<<"Poda≥eú prawid≥owe miasto!"<<endl;
            break;
        }
        else if (nazwa_miasta[nazwa_miasta.size()] != miasto && i == nazwa_miasta.size() )
        {
            cout<<"Podales niepoprawne miasto! Moze chodzilo ci o: "<<endl;
            for(unsigned int i = 0; i<nazwa_miasta.size(); i++)
            {
                if(nazwa_miasta[i].substr(1,3) == miasto.substr(1,3))
                {
                    cout<<nazwa_miasta[i]<<endl;
                }
            }

            goto err1;
            break;
        }

    }


    cout<<"Podaj promien: ";
    cin>>promien;

    cout<<"Te miasta znajduja sie w podnaym promieniu: "<<endl;

    for(unsigned int i = 0; i<=nazwa_miasta.size(); i++)
{
    //wynik = sqrt(pow(dlugosc_geo[i]-dlugosc_geo[i+1]) + pow(szerokosc_geo[i]-szerokosc_geo[i+1]))*73;
    if(wynik <= promien)
    {
        cout<<"Twoje miasta w podanym obszarze"<<endl;
        break; //testowo
        //cout<<nazwa_miasta[i]<<endl;
    }
}


    /*for( unsigned int i = 0; i < nazwa_miasta.size(); i++ )
    {
        cout << nazwa_miasta[ i ] << endl;
    }

    cout<<"------------------------------------------------------------"<<endl;

    for( unsigned int j = 0; j < dlugosc_geo.size(); j++ )
    {
        cout << dlugosc_geo[ j ] << endl;
    }
    cout<<"------------------------------------------------------------"<<endl;

    for( unsigned int k = 0; k <  szerokosc_geo.size(); k++ )
    {
        cout <<  szerokosc_geo[ k ] << endl;
    }*/

    city.close();

    return 0;
}
