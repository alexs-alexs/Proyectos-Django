# views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login as auth_login
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.contrib import messages
from .forms import Registro
from django.urls import reverse
from .models import PerfilUsuario

@login_required 
def index(request):
    return render(request, 'index.html')

def salir(request):
    logout(request)
    messages.success(request, 'Sesión cerrada')
    return redirect('login')

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        usuario = authenticate(request, username=username, password=password)
        if usuario is not None:
            auth_login(request, usuario)
            messages.success(request, f'Bienvenido {username}')
            return redirect('index') 
        else:
            messages.error(request, 'Datos incorrectos')
            return render(request, 'users/login.html')
    
    return render(request, 'users/login.html')


"""def registro(request):
    form = Registro(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        username = form.cleaned_data.get('username')
        email = form.cleaned_data.get('email')
        password = form.cleaned_data.get('password')
        edad = form.cleaned_data.get('edad')
        try:
            usuario = User.objects.create_user(username, email, password,edad)
            if usuario:
                auth_login(request, usuario)
                messages.success(request, f'Bienvenido {username}')
                return redirect('index')
        except Exception as e:
            messages.error(request, 'Error al crear la cuenta. Por favor, inténtelo de nuevo.')
    return render(request, 'users/registro.html', {'form': form})"""

def registro(request):
    form = Registro(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        username = form.cleaned_data.get('username')
        email = form.cleaned_data.get('email')
        password = form.cleaned_data.get('password')
        edad = form.cleaned_data.get('edad')
      #  try:
        usuario = User.objects.create_user(username, email, password)
        PerfilUsuario.objects.create(user=usuario, edad=edad)  # Crear PerfilUsuario
        if usuario:
            auth_login(request, usuario)
            messages.success(request, f'Bienvenido {username}')
            return redirect('index')
        #except Exception as e:
         #   messages.error(request, 'Error al crear la cuenta. Por favor, inténtelo de nuevo.')
    return render(request, 'users/registro.html', {'form': form})

"""@login_required
def evaluacion(request):
    # Obtener el nombre de usuario y la edad del objeto de solicitud
    nombre_usuario = request.user.username
    edad_usuario = request.user.edad  # Asumiendo que 'edad' es un campo de tu modelo PerfilUsuario
    
    context = {
        'nombre_usuario': nombre_usuario,
        'edad_usuario': edad_usuario
    }
    return render(request, 'evaluacion.html', context)"""

@login_required
def evaluacion(request):
    # Obtener el perfil de usuario asociado al usuario actual
    perfil_usuario = PerfilUsuario.objects.get(user=request.user)
    
    # Obtener el nombre de usuario y la edad del perfil de usuario
    nombre_usuario = request.user.username
    edad_usuario = perfil_usuario.edad
    
    context = {
        'nombre_usuario': nombre_usuario,
        'edad_usuario': edad_usuario
    }
    return render(request, 'evaluacion.html', context)

@login_required
def preguntas_view(request):
    # Obtener el nombre de usuario del objeto de solicitud
    nombre_usuario = request.user.username
    
    context = {
        'nombre_usuario': nombre_usuario,
        'evaluacion_url': reverse('evaluacion')
    }
    return render(request, 'preguntas.html', context)