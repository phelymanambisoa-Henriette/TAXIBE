import os
import glob
import subprocess

def delete_migrations():
    """Supprime tous les fichiers de migration sauf __init__.py"""
    apps = ['utilisateur', 'interaction', 'transport', 'localisation']
    
    for app in apps:
        migration_dir = f"{app}/migrations"
        if os.path.exists(migration_dir):
            files = glob.glob(f"{migration_dir}/*.py")
            for file in files:
                if not file.endswith('__init__.py'):
                    try:
                        os.remove(file)
                        print(f"🗑️ Supprimé: {file}")
                    except Exception as e:
                        print(f"⚠️ Impossible de supprimer {file}: {e}")

def delete_database():
    """Supprime la base de données SQLite"""
    if os.path.exists('db.sqlite3'):
        try:
            os.remove('db.sqlite3')
            print("🗑️ Base de données supprimée")
        except Exception as e:
            print(f"⚠️ Impossible de supprimer la base: {e}")

def recreate_migrations():
    """Recrée les migrations dans l'ordre correct"""
    print("🔧 Création des migrations...")
    
    try:
        # Ordre important pour éviter les dépendances circulaires
        subprocess.run(['python', 'manage.py', 'makemigrations', 'utilisateur'], check=True)
        print("✅ Migrations utilisateur créées")
        
        subprocess.run(['python', 'manage.py', 'makemigrations', 'transport'], check=True)
        print("✅ Migrations transport créées")
        
        subprocess.run(['python', 'manage.py', 'makemigrations', 'localisation'], check=True)
        print("✅ Migrations localisation créées")
        
        subprocess.run(['python', 'manage.py', 'makemigrations', 'interaction'], check=True)
        print("✅ Migrations interaction créées")
        
        print("🚀 Application des migrations...")
        subprocess.run(['python', 'manage.py', 'migrate'], check=True)
        print("✅ Migrations appliquées")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de la création des migrations: {e}")
        raise

if __name__ == "__main__":
    print("🛠️  DÉBUT DE LA RÉPARATION DES MIGRATIONS...")
    
    try:
        delete_migrations()
        delete_database()
        recreate_migrations()
        
        print("✅ RÉPARATION TERMINÉE AVEC SUCCÈS!")
        print("📋 Prochaines étapes:")
        print("   1. Lancez le serveur: python manage.py runserver")
        print("   2. Testez l'application")
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        print("💡 Essayez cette commande manuellement:")
        print("   python manage.py migrate --fake")