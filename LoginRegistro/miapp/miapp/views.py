from django.http import HttpResponse

from django.shortcuts import render
from django.shortcuts import redirect
from django.contrib.auth import login as lg
from django.contrib import messages

from django.contrib.auth import authenticate

from django.contrib.auth import logout

from .forms import Registro

from django.contrib.auth.models import User


def index (request):
    return render(request,'index.html',{
        "mensaje":"Saludos desde Django",
        "lista":[1,2,3,4,5,6,7],
        "personas":[ 
            {'titulo':'Maria','edad':15 ,'adulto':False},
            {'titulo':'Matias','edad':18 ,'adulto':True},
            {'titulo':'Jorge','edad':11 ,'adulto':False},
            {'titulo':'Martha','edad':22 ,'adulto':True}          
            ]
    })

def login (request):
    print(request.method)

    if request.method == 'POST':
        usuario = request.POST.get('username')
        clave =  request.POST.get('password')
        
        print(usuario)
        print(clave)

        verificar_usuarios = authenticate(username=usuario,password=clave)

        if verificar_usuarios:
            lg(request,verificar_usuarios)
            print("usuario correcto")
            messages.success(request,f'Bienvenido {usuario}')
            return redirect('index')
        else:
            print("usuario incorrecto")
            messages.success(request,f'Usuario: {usuario} o Contraseña: {clave} es incorrecto')

    return render(request,'users/login.html')

def salir(request):
    logout(request)
    messages.success(request,'Sesion Terminada')
    return redirect('login')

def registro(request):
    form=Registro(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        username =  form.cleaned_data.get('username')
        correo = form.cleaned_data.get('correo')
        password = form.cleaned_data.get('password')

        print(username,correo,password)

        usuario = User.objects.create_user(username,correo,password)

        if usuario:
            lg(request,usuario)
            messages.success(request,f'Bienvenido {username}')
            return redirect('index')




    return render (request,'users/registro.html',{
      'form':form ,
    })
