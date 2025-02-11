from rest_framework import serializers

class LoginSerializer(serializers.Serializer):
    correo_usuario = serializers.EmailField()
    password = serializers.CharField(write_only=True)
