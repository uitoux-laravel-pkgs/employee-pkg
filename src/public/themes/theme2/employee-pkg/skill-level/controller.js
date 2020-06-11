app.component('skillLevelList', {
    templateUrl: skill_level_list_template_url,
    controller: function($http, $location, HelperService, $scope, $routeParams, $rootScope, $element, $mdSelect) {
        $scope.loading = true;
        $('#search_skill_level').focus();
        var self = this;
        $('li').removeClass('active');
        $('.master_link').addClass('active').trigger('click');
        self.hasPermission = HelperService.hasPermission;
        if (!self.hasPermission('skill-levels')) {
            window.location = "#!/permission-denied";
            return false;
        }
        self.add_permission = self.hasPermission('add-skill-level');
        var table_scroll;
        table_scroll = $('.page-main-content.list-page-content').height() - 37;
        var dataTable = $('#skill_levels_list').DataTable({
            "dom": cndn_dom_structure,
            "language": {
                // "search": "",
                // "searchPlaceholder": "Search",
                "lengthMenu": "Rows _MENU_",
                "paginate": {
                    "next": '<i class="icon ion-ios-arrow-forward"></i>',
                    "previous": '<i class="icon ion-ios-arrow-back"></i>'
                },
            },
            pageLength: 10,
            processing: true,
            stateSaveCallback: function(settings, data) {
                localStorage.setItem('CDataTables_' + settings.sInstance, JSON.stringify(data));
            },
            stateLoadCallback: function(settings) {
                var state_save_val = JSON.parse(localStorage.getItem('CDataTables_' + settings.sInstance));
                if (state_save_val) {
                    $('#search_skill_level').val(state_save_val.search.search);
                }
                return JSON.parse(localStorage.getItem('CDataTables_' + settings.sInstance));
            },
            serverSide: true,
            paging: true,
            stateSave: true,
            scrollY: table_scroll + "px",
            scrollCollapse: true,
            ajax: {
                url: laravel_routes['getSkillLevelList'],
                type: "GET",
                dataType: "json",
                data: function(d) {
                    d.short_name = $("#short_name").val();
                    d.name = $("#name").val();
                    d.description = $("#description").val();
                    d.status = $("#status").val();
                },
            },

            columns: [
                { data: 'action', class: 'action', name: 'action', searchable: false },
                { data: 'short_name', name: 'skill_levels.short_name' },
                { data: 'name', name: 'skill_levels.name' },
                { data: 'description', name: 'skill_levels.description' },
                { data: 'status', name: '' },

            ],
            "infoCallback": function(settings, start, end, max, total, pre) {
                $('#table_infos').html(total)
                $('.foot_info').html('Showing ' + start + ' to ' + end + ' of ' + max + ' entries')
            },
            rowCallback: function(row, data) {
                $(row).addClass('highlight-row');
            }
        });
        $('.dataTables_length select').select2();

        $scope.clear_search = function() {
            $('#search_skill_level').val('');
            $('#skill_levels_list').DataTable().search('').draw();
        }
        $('.refresh_table').on("click", function() {
            $('#skill_levels_list').DataTable().ajax.reload();
        });

        var dataTables = $('#skill_levels_list').dataTable();
        $("#search_skill_level").keyup(function() {
            dataTables.fnFilter(this.value);
        });

        //DELETE
        $scope.deleteSkillLevel = function($id) {
            $('#skill_level_id').val($id);
        }
        $scope.deleteConfirm = function() {
            $id = $('#skill_level_id').val();
            $http.get(
                laravel_routes['deleteSkillLevel'], {
                    params: {
                        id: $id,
                    }
                }
            ).then(function(response) {
                if (response.data.success) {
                    custom_noty('success', 'Skill Level Deleted Successfully');
                    $('#skill_levels_list').DataTable().ajax.reload(function(json) {});
                    $location.path('/employee-pkg/skill-level/list');
                }
            });
        }

        // FOR FILTER
        $http.get(
            laravel_routes['getSkillLevelFilter']
        ).then(function(response) {
            // console.log(response);
            self.extras = response.data.extras;
        });
        $element.find('input').on('keydown', function(ev) {
            ev.stopPropagation();
        });
        $scope.clearSearchTerm = function() {
            $scope.searchTerm = '';
            $scope.searchTerm1 = '';
            $scope.searchTerm2 = '';
            $scope.searchTerm3 = '';
        };
        /* Modal Md Select Hide */
        $('.modal').bind('click', function(event) {
            if ($('.md-select-menu-container').hasClass('md-active')) {
                $mdSelect.hide();
            }
        });
        // $('#short_name').on('keyup', function() {
        //     dataTables.fnFilter();
        // });
        // $('#name').on('keyup', function() {
        //     dataTables.fnFilter();
        // });
        // $scope.onSelectedStatus = function(id) {
        //     $('#status').val(id);
        //     dataTables.fnFilter();
        // }
        $scope.applyFilter = function() {
            $('#status').val(self.status);
            dataTables.fnFilter();
            $('#skill-level-filter-modal').modal('hide');
        }

        $scope.reset_filter = function() {
            $("#short_name").val('');
            $("#name").val('');
            $("#status").val('');
            dataTables.fnFilter();
            $('#skill-level-filter-modal').modal('hide');
        }
        $rootScope.loading = false;
    }
});

//------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------

app.component('skillLevelForm', {
    templateUrl: skill_level_form_template_url,
    controller: function($http, $location, HelperService, $scope, $routeParams, $rootScope, $element) {
        var self = this;
        $("input:text:visible:first").focus();

        self.hasPermission = HelperService.hasPermission;
        if (!self.hasPermission('add-skill-level') && !self.hasPermission('edit-skill-level')) {
            window.location = "#!/permission-denied";
            return false;
        }
        self.angular_routes = angular_routes;
        $http.get(
            laravel_routes['getSkillLevelFormData'], {
                params: {
                    id: typeof($routeParams.id) == 'undefined' ? null : $routeParams.id,
                }
            }
        ).then(function(response) {
            self.skill_level = response.data.skill_level;
            self.action = response.data.action;
            $rootScope.loading = false;
            if (self.action == 'Edit') {
                if (self.skill_level.deleted_at) {
                    self.switch_value = 'Inactive';
                } else {
                    self.switch_value = 'Active';
                }
            } else {
                self.switch_value = 'Active';
            }
        });

        //Save Form Data 
        var form_id = '#skill_level_form';
        var v = jQuery(form_id).validate({
            ignore: '',
            rules: {
                'short_name': {
                    required: true,
                    minlength: 2,
                    maxlength: 32,
                }
                // 'name': {
                //     minlength: 3,
                //     maxlength: 128,
                // },
                // 'description': {
                //     minlength: 3,
                //     maxlength: 255,
                // }
            },
            messages: {
                'short_name': {
                    minlength: 'Minimum 2 Characters',
                    maxlength: 'Maximum 32 Characters',
                }
                // 'name': {
                //     minlength: 'Minimum 3 Characters',
                //     maxlength: 'Maximum 128 Characters',
                // },
                // 'description': {
                //     minlength: 'Minimum 3 Characters',
                //     maxlength: 'Maximum 255 Characters',
                // }
            },
            invalidHandler: function(event, validator) {
                custom_noty('error', 'You have errors, Please check the tab');
            },
            submitHandler: function(form) {
                let formData = new FormData($(form_id)[0]);
                $('.submit').button('loading');
                $.ajax({
                        url: laravel_routes['saveSkillLevel'],
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                    })
                    .done(function(res) {
                        if (res.success == true) {
                            custom_noty('success', res.message);
                            $location.path('/employee-pkg/skill-level/list');
                            $scope.$apply();
                        } else {
                            if (!res.success == true) {
                                $('.submit').button('reset');
                                showErrorNoty(res);
                            } else {
                                $('.submit').button('reset');
                                $location.path('/employee-pkg/skill-level/list');
                                $scope.$apply();
                            }
                        }
                    })
                    .fail(function(xhr) {
                        $('.submit').button('reset');
                        custom_noty('error', 'Something went wrong at server');
                    });
            }
        });
    }
});
//------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------