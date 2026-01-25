from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    usuario = serializers.CharField()
    password = serializers.CharField(write_only=True)
    subdominio = serializers.CharField(required=False, allow_blank=True)
