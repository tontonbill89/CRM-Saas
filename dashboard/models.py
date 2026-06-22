from django.db import models
from django.utils import timezone
# Create your models here.

class ProfileUser(models.Model):
    id_profile_user = models.AutoField(primary_key=True)
    nom_profile = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'profile_user'
        verbose_name = "Profile User"
        verbose_name_plural = "Profile Users"
    
    def __str__(self):
        return self.nom_profile

class Equipe(models.Model):
    id_equipe = models.AutoField(primary_key=True)
    nom_equipe = models.CharField(max_length=20, unique=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'equipe'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_equipe

class Secteur(models.Model):
    id_secteur = models.AutoField(primary_key=True)
    nom_secteur = models.CharField(max_length=20, unique=True)
    id_equipe = models.ForeignKey(Equipe, on_delete=models.SET_NULL, db_column='id_equipe', null=True, blank=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'secteur'
        indexes = [
            models.Index(fields=['synchroniser']),
            models.Index(fields=['id_equipe']),
        ]
    
    def __str__(self):
        return self.nom_secteur

class Utilisateur(models.Model):
    login = models.CharField(primary_key=True, max_length=50)
    mot_de_passe = models.CharField(max_length=255)
    tel_user = models.CharField(max_length=20, null=True,blank=True)
    id_equipe = models.ForeignKey(Equipe, on_delete=models.SET_NULL, db_column='id_equipe', null=True, blank=True)
    id_secteur = models.ForeignKey(Secteur, on_delete=models.SET_NULL, db_column='id_secteur', null=True, blank=True)
    id_profile_user = models.ForeignKey(ProfileUser, on_delete=models.SET_NULL, db_column='id_profile_user', null=True, blank=True)
    nom_user = models.CharField(max_length=100, blank=True, null=True)
    id_phone = models.CharField(max_length=50, blank=True, null=True)
    online = models.CharField(max_length=4, default='Non')
    activer = models.CharField(max_length=4, default='Oui', blank=True, null=True)
    email = models.EmailField(max_length=50, unique=True, blank=True, null=True)
    groupe = models.CharField(max_length=20, blank=True, null=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'utilisateur'
        indexes = [
            models.Index(fields=['id_equipe']),
            models.Index(fields=['id_secteur']),
            models.Index(fields=['id_profile_user']),
            models.Index(fields=['synchroniser']),
        ]

    @property
    def is_admin(self):
        return self.id_profile_user and self.id_profile_user.nom_profile == 'Admin'

    @property
    def is_superviseur(self):
        return self.id_profile_user and self.id_profile_user.nom_profile == 'Superviseur'

    def __str__(self):
        return self.nom_user

class CategorieProd(models.Model):
    id_cat = models.AutoField(primary_key=True)
    nom_cat = models.CharField(max_length=50)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'categorie_prod'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_cat

class FamilleProd(models.Model):
    id_famille = models.AutoField(primary_key=True)
    nom_famille = models.CharField(max_length=50)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'famille_prod'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_famille

class MarqueProd(models.Model):
    id_marque = models.AutoField(primary_key=True)
    nom_marque = models.CharField(max_length=50)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'marque_prod'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_marque

class Packaging(models.Model):
    id_packaging = models.AutoField(primary_key=True)
    nom_packaging = models.CharField(max_length=20)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'packaging'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_packaging

class Produit(models.Model):
    id_produit = models.AutoField(primary_key=True)
    nom_produit = models.CharField(max_length=100, null=True)
    description = models.TextField(blank=True, null=True)
    prix_ht = models.DecimalField(max_digits=24, decimal_places=0, default=0)
    prix_carton = models.DecimalField(max_digits=24, decimal_places=0, default=0)
    id_marque = models.ForeignKey(MarqueProd, on_delete=models.SET_NULL, null=True, blank=True,db_column='id_marque')
    id_famille = models.ForeignKey(FamilleProd, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_famille')
    id_categorie = models.ForeignKey(CategorieProd, on_delete=models.SET_NULL, null=True, blank=True,db_column='id_categorie')
    id_packaging = models.ForeignKey(Packaging, on_delete=models.SET_NULL, null=True, blank=True,db_column='id_packaging')
    format = models.CharField(max_length=20, blank=True, null=True)
    conditionnement = models.CharField(max_length=20, blank=True, null=True)
    prix_semi_gros = models.CharField(max_length=20, blank=True, null=True)
    prix_achat_pdv = models.CharField(max_length=20, blank=True, null=True)
    prix_consommateur = models.CharField(max_length=20, blank=True, null=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    def __str__(self):
        return self.nom_produit or ""
    
    class Meta:
        db_table = 'produit'
        indexes = [
            models.Index(fields=['prix_ht']),
            models.Index(fields=['id_marque']),
            models.Index(fields=['id_famille']),
            models.Index(fields=['id_categorie']),
            models.Index(fields=['id_packaging']),
            models.Index(fields=['synchroniser']),
        ]

class Client(models.Model):
    id_client = models.AutoField(primary_key=True)
    nom_boutique = models.CharField(max_length=200)
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)
    nom_gerant = models.CharField(max_length=200)
    tel_gerant = models.CharField(max_length=20)
    statut = models.CharField(max_length=20,blank=True, null=True)
    id_user = models.CharField(max_length=50, null=True, blank=True)
    cat = models.CharField(max_length=50,blank=True, null=True)
    sub_cat = models.CharField(max_length=50,blank=True, null=True)
    quartier = models.CharField(max_length=20,blank=True, null=True)
    region = models.CharField(max_length=20,blank=True, null=True)
    arrond = models.CharField(max_length=20,blank=True, null=True)
    ville = models.CharField(max_length=20,blank=True, null=True)
    id_equipe = models.ForeignKey(Equipe, on_delete=models.SET_NULL, blank=True, null=True, db_column='id_equipe')
    id_secteur = models.ForeignKey(Secteur, on_delete=models.SET_NULL, blank=True, null=True, db_column='id_secteur')
    valider = models.CharField(max_length=5, default="Oui")
    photo = models.TextField(blank=True, null=True)  # LONGTEXT
    route = models.CharField(max_length=20, blank=True, null=True)
    groupe = models.CharField(max_length=20,blank=True,null=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'client'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]

class Concurrent(models.Model):
    id_concurrent = models.AutoField(primary_key=True)
    nom_concurrent = models.CharField(max_length=100, null=True)
    description = models.TextField(blank=True, null=True)
    prix_ht = models.DecimalField(max_digits=24, decimal_places=6, blank=True, null=True)
    prix_carton = models.DecimalField(max_digits=24, decimal_places=6, default=0)
    id_marque = models.IntegerField(null=True, blank=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'concurrent'
        indexes = [
            models.Index(fields=['prix_ht']),
            models.Index(fields=['id_marque']),
            models.Index(fields=['synchroniser']),
        ]

class Correction(models.Model):
    id_correction = models.AutoField(primary_key=True)
    nom_correction = models.CharField(max_length=100, null=False)
    description = models.TextField(blank=True, null=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'correction'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_correction

class Investissement(models.Model):
    id_investissement = models.AutoField(primary_key=True)
    nom_investissement = models.CharField(max_length=100, null=False)
    description = models.TextField(blank=True, null=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'investissement'
        indexes = [
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.nom_investissement

class Entrepot(models.Model):
    id_entrepot = models.CharField(primary_key=True, max_length=50)
    login = models.ForeignKey(Utilisateur, on_delete=models.PROTECT, db_column='login')
    typeentrepot = models.CharField(max_length=20,blank=True, null=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'entrepot'
        indexes = [
            models.Index(fields=['login']),
            models.Index(fields=['typeentrepot']),
            models.Index(fields=['synchroniser']),
        ]
    
    def __str__(self):
        return self.id_entrepot

class StockEntrepot(models.Model):
    id_stock = models.AutoField(primary_key=True)
    quantite = models.IntegerField(default=0)
    id_produit = models.ForeignKey(Produit, on_delete=models.CASCADE, db_column='id_produit',null=True)
    id_entrepot = models.ForeignKey(Entrepot, on_delete=models.CASCADE, null=True, db_column='id_entrepot')
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'stockentrepot'
        indexes = [
            models.Index(fields=['quantite']),
            models.Index(fields=['id_produit']),
            models.Index(fields=['id_entrepot']),
            models.Index(fields=['synchroniser']),
        ]

class MvtEntrepot(models.Model):
    id_mvt = models.CharField(primary_key=True, max_length=50)
    date_mvt = models.DateField(null=True, blank=True)
    entrepot_source = models.CharField(max_length=50, blank=True, null=True)
    entrepot_destination = models.CharField(max_length=50, blank=True, null=True)
    statut = models.CharField(max_length=20, default='En attente')
    mode_mvt = models.CharField(max_length=10, blank=True, null=True)
    date_validation = models.DateField(null=True, blank=True)
    synchroniser = models.CharField(max_length=5, blank=True, null=True)

    class Meta:
        db_table = 'mvtentrepot'
        indexes = [
            models.Index(fields=['date_mvt']),
            models.Index(fields=['date_validation']),
            models.Index(fields=['entrepot_source']),
            models.Index(fields=['entrepot_destination']),
            models.Index(fields=['statut']),
            models.Index(fields=['synchroniser']),
        ]

class DetailMvtEntrepot(models.Model):
    id_detail_mvt = models.AutoField(primary_key=True)
    quantite = models.IntegerField(default=0)
    id_mvt = models.ForeignKey(MvtEntrepot, on_delete=models.CASCADE, db_column='id_mvt',null=True)
    id_produit = models.ForeignKey(Produit, on_delete=models.CASCADE, db_column='id_produit', null=True)

    class Meta:
        db_table = 'detailmvtentrepot'
        indexes = [
            models.Index(fields=['id_mvt']),
            models.Index(fields=['id_produit']),
        ]


class Planning(models.Model):
    id_planning = models.CharField(primary_key=True, max_length=50)
    date_planning = models.DateField()
    valider = models.CharField(max_length=5)
    realiser = models.CharField(max_length=10)
    user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, null=True, db_column='login')
    ajouter_le = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'planning'
        indexes = [
            models.Index(fields=['user']),
        ]

class PlanningClient(models.Model):
    id_planning_client = models.CharField(primary_key=True,max_length=50)
    id_client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, db_column='id_client')
    id_planning = models.ForeignKey(Planning, on_delete=models.CASCADE, null=True, db_column='id_planning')
    visiter = models.CharField(max_length=20)

    class Meta:
        db_table = 'planning_client'
        indexes = [
            models.Index(fields=['id_planning']),
            models.Index(fields=['visiter']),
        ]

class Visite(models.Model):
    id_visite = models.CharField(max_length=50, primary_key=True)
    id_client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True,db_column='id_client')
    date_visite = models.DateField(null=True, blank=True)
    heure_debut = models.TimeField(null=True, blank=True)
    heure_fin = models.TimeField(null=True, blank=True)
    commentaire = models.TextField(blank=True, null=True)
    login = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, blank=True, null=True, db_column='login')
    synchroniser = models.CharField(max_length=5)
    id_planning = models.ForeignKey(Planning, on_delete=models.SET_NULL, blank=True, null=True, db_column='id_planning')

    class Meta:
        db_table = 'visite'
        indexes = [
            models.Index(fields=['id_client']),
            models.Index(fields=['login']),
            models.Index(fields=['id_planning']),
        ]

class Vente(models.Model):
    id_vente = models.CharField(max_length=50, primary_key=True)
    montant_vente = models.FloatField(default=0)
    montant_payer = models.FloatField(default=0)
    montant_restant = models.IntegerField(default=0)
    date_vente = models.DateField(null=True, blank=True)
    login = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, blank=True, null=True,db_column='login')
    id_visite = models.ForeignKey(Visite, on_delete=models.SET_NULL, blank=True, null=True,db_column='id_visite')
    remise = models.IntegerField(default=0,blank=True, null=True)

    class Meta:
        db_table = 'vente'
        indexes = [
            models.Index(fields=['login']),
            models.Index(fields=['id_visite']),
        ]

class DetailsVente(models.Model):
    id_detail = models.AutoField(primary_key=True)
    quantite = models.IntegerField(default=0)
    prix_vente = models.FloatField(default=0)
    id_vente = models.ForeignKey(Vente, on_delete=models.CASCADE, db_column='id_vente')
    id_produit = models.ForeignKey(Produit, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_produit')

    class Meta:
        db_table = 'detailsvente'
        indexes = [
            models.Index(fields=['id_vente']),
            models.Index(fields=['id_produit']),
        ]

class DetailsVisiteProduit(models.Model):
    id_details = models.BigAutoField( primary_key=True)
    stock = models.IntegerField(default=0)
    prix_carton = models.DecimalField(max_digits=24, decimal_places=2, blank=True, null=True)
    prix_vente = models.DecimalField(max_digits=24, decimal_places=2, blank=True, null=True)
    position_produit = models.TextField(blank=True, null=True)
    presence = models.CharField(max_length=5, blank=True, null=True)
    id_visite = models.ForeignKey(Visite, on_delete=models.CASCADE, db_column='id_visite', blank=True, null=True)
    id_produit = models.ForeignKey(Produit, on_delete=models.SET_NULL, blank=True, null=True, db_column='id_produit')

    class Meta:
        db_table = 'detailsvisiteproduit'
        indexes = [
            models.Index(fields=['id_visite']),
            models.Index(fields=['id_produit']),
        ]

class DetailsVisiteConcurrent(models.Model):
    id_details = models.AutoField( primary_key=True)
    stock = models.IntegerField(default=0)
    prix_carton = models.DecimalField(max_digits=24, decimal_places=6, default=0)
    prix_vente = models.DecimalField(max_digits=24, decimal_places=6, default=0)
    position_produit = models.TextField(blank=True, null=True)
    presence = models.CharField(max_length=5, blank=True, null=True)
    id_visite = models.ForeignKey(Visite, on_delete=models.CASCADE, db_column='id_visite', blank=True, null=True)
    nom_concurrent = models.CharField(max_length=50)

    class Meta:
        db_table = 'detailsvisiteconcurrent'
        indexes = [
            models.Index(fields=['id_visite']),
            models.Index(fields=['nom_concurrent']),
        ]


class DetailsVisiteCorrection(models.Model):
    id_details = models.AutoField(primary_key=True)
    id_visite = models.ForeignKey(Visite, on_delete=models.CASCADE, db_column='id_visite')
    id_correction = models.ForeignKey(Correction, on_delete=models.SET_NULL,  blank=True, null=True,db_column='id_correction')

    class Meta:
        db_table = 'detailsvisitecorrection'
        indexes = [
            models.Index(fields=['id_visite']),
            models.Index(fields=['id_correction']),
        ]


class DetailsVisiteInvestissement(models.Model):
    id_details = models.AutoField(primary_key=True)
    etat = models.CharField(max_length=10, blank=True, null=True)
    presence = models.CharField(max_length=5, blank=True, null=True)
    id_visite = models.ForeignKey(Visite, on_delete=models.SET_NULL, db_column='id_visite', null=True, blank=True)
    id_investissement = models.ForeignKey(Investissement, on_delete=models.SET_NULL, blank=True, null=True,db_column='id_investissement')

    class Meta:
        db_table = 'detailsvisiteinvestissement'
        indexes = [
            models.Index(fields=['id_visite']),
            models.Index(fields=['id_investissement']),
        ]

class DerniereVisite(models.Model):
    id = models.AutoField(primary_key=True)
    id_visite = models.ForeignKey(Visite, on_delete=models.CASCADE, db_column='id_visite', null=True)
    id_client = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='id_client', null=True)
    date_visite = models.DateField(blank=True, null=True)

    class Meta:
        db_table = 'dernierevisite'
        indexes = [
            models.Index(fields=['id_client']),
            models.Index(fields=['id_visite']),
        ]

class DetailDernierVisite(models.Model):
    id_detail = models.CharField(primary_key=True, max_length=50)
    id_visite = models.ForeignKey(DerniereVisite, on_delete=models.SET_NULL, blank=True, null=True, db_column='id_visite')
    article = models.CharField(max_length=100, blank=True, null=True)
    id_marque = models.IntegerField(default=0)

    class Meta:
        db_table = 'detaildernieravisite'
        indexes = [
            models.Index(fields=['id_visite']),
            models.Index(fields=['article']),
            models.Index(fields=['id_marque']),
        ]

class Parcours(models.Model):
    id_parcours = models.CharField(primary_key=True, max_length=50)
    date_jour = models.CharField(max_length=20)
    heure_debut = models.TimeField(default='00:00:00')
    heure_fin = models.TimeField(default='00:00:00')
    lat = models.CharField(max_length=20)
    lon = models.CharField(max_length=20)
    login = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, blank=True, null=True, db_column='login')

    class Meta:
        db_table = 'parcours'
        indexes = [
            models.Index(fields=['login'])
        ]

class SuiviUser(models.Model):
    id_suivi_user = models.CharField(primary_key=True, max_length=50)
    login = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, db_column='login', null=True, blank=True)
    date_suivi = models.DateField(null=True, blank=True)
    longitude = models.CharField(max_length=50, blank=True, null=True)
    latitude = models.CharField(max_length=50, blank=True, null=True)
    imei = models.CharField(max_length=50)

    class Meta:
        db_table = 'suiviuser'
        indexes = [
            models.Index(fields=['login']),
            models.Index(fields=['date_suivi']),
        ]