from django import forms
from django.contrib.auth.models import User

class Registro(forms.Form):

    username = forms.CharField(label='Usuario',required=True,min_length=5,max_length=30,
               widget=forms.TextInput(attrs={
                   'class':'form-control',
                   'placeholder':'Nombre de Usuario'
               })                
                               )
    correo  = forms.EmailField(required=True,min_length=5,max_length=30,
               widget=forms.TextInput(attrs={
                   'class':'form-control',
                   'placeholder':'ejemplo@gmail.com'
               })                
                               )
    password = forms.CharField(label='Contraseña',required=True,min_length=3,
               widget=forms.PasswordInput(attrs={
                   'class':'form-control',
                   'placeholder':'contraseña'}
                               ))
    
    confirmar_password = forms.CharField(label='Confirmar Contraseña',required=True,min_length=3,
               widget=forms.PasswordInput(attrs={
                   'class':'form-control',
                   'placeholder':'repita su contraseña contraseña'}
                               ))
    
    def clean_username(self):
        username = self.cleaned_data.get('username')

        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('El nombre de usuario ya existe')
        
        return username
    
    def clean_correo(self):
        correo = self.cleaned_data.get('correo')

        if User.objects.filter(email=correo).exists():
            raise forms.ValidationError('El Correo ya Existe')
        
        return correo
    
    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get('confirmar_password') != cleaned_data.get('password'):
            self.add_error('confirmar_password','La contraseña no coincide')



